import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Workspace } from '../models/Workspace.js';
import mongoose from 'mongoose';

/**
 * Task Controller
 * 
 * Enforces strict multi-tenant boundary checks:
 * 1. Queries and updates are strictly constrained to req.workspaceId.
 * 2. Before creating or reassigning a task, we verify that target project
 *    EXISTS and BELONGS to the EXACT same workspaceId.
 */

// GET /api/tasks
export async function getTasks(req, res, next) {
  try {
    const filter = { workspaceId: req.workspaceId };

    if (req.query.projectId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.projectId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid projectId format: '${req.query.projectId}'`,
        });
      }

      const projectExists = await Project.findOne({
        _id: req.query.projectId,
        workspaceId: req.workspaceId,
      });

      if (!projectExists) {
        return res.status(400).json({
          success: false,
          message: `Project '${req.query.projectId}' does not belong to active workspace scope.`,
        });
      }

      filter.projectId = req.query.projectId;
    }

    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    if (req.query.priority && req.query.priority !== 'all') {
      filter.priority = req.query.priority;
    }

    if (req.query.assignee && req.query.assignee !== 'all') {
      filter['assignee.name'] = req.query.assignee;
    }

    if (req.query.search) {
      const term = req.query.search.trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { tags: { $in: [new RegExp(term, 'i')] } },
      ];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/tasks/:id
export async function getTaskById(req, res, next) {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ _id: id, workspaceId: req.workspaceId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID '${id}' was not found in active workspace scope.`,
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/tasks
export async function createTask(req, res, next) {
  try {
    const {
      projectId,
      title,
      description,
      status,
      priority,
      assignee,
      dueDate,
      tags,
      storyPoints,
    } = req.body;

    // Validate that project exists and belongs to the active tenant workspace
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid projectId is required.',
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      workspaceId: req.workspaceId,
    });

    if (!project) {
      return res.status(400).json({
        success: false,
        message: `Project '${projectId}' does not exist or does not belong to the active workspace. Cross-workspace assignment is strictly prohibited.`,
      });
    }

    const task = await Task.create({
      workspaceId: req.workspaceId,
      projectId: project._id,
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: assignee || { name: req.user?.name || 'Workspace Member', avatar: req.user?.avatar || 'U' },
      dueDate: dueDate || '',
      tags: tags || [],
      storyPoints: Number(storyPoints) || 3,
    });

    // Record activity in parent workspace
    await Workspace.findByIdAndUpdate(req.workspaceId, {
      $push: {
        activities: {
          $each: [
            {
              user: req.user?.name || assignee?.name || 'You',
              action: 'created task',
              target: task.title,
              destination: status || 'todo',
              timestamp: 'Just now',
              createdAt: new Date(),
            },
          ],
          $position: 0,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/tasks/:id
export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;

    // Fetch existing task scoped to workspace
    const existingTask = await Task.findOne({ _id: id, workspaceId: req.workspaceId });
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: `Task with ID '${id}' was not found in active workspace scope.`,
      });
    }

    // If projectId is being updated, verify target project also belongs to same workspace
    if (req.body.projectId && req.body.projectId !== existingTask.projectId.toString()) {
      if (!mongoose.Types.ObjectId.isValid(req.body.projectId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target projectId format.',
        });
      }

      const targetProject = await Project.findOne({
        _id: req.body.projectId,
        workspaceId: req.workspaceId,
      });

      if (!targetProject) {
        return res.status(400).json({
          success: false,
          message: 'Target project does not belong to the active workspace.',
        });
      }
    }

    const allowedUpdates = [
      'projectId',
      'title',
      'description',
      'status',
      'priority',
      'assignee',
      'dueDate',
      'tags',
      'storyPoints',
    ];

    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const oldStatus = existingTask.status;
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, workspaceId: req.workspaceId },
      updates,
      { new: true, runValidators: true }
    );

    // If status changed, record activity in workspace
    if (updates.status && updates.status !== oldStatus) {
      await Workspace.findByIdAndUpdate(req.workspaceId, {
        $push: {
          activities: {
            $each: [
              {
                user: updatedTask.assignee?.name || 'You',
                action: 'moved task',
                target: updatedTask.title,
                destination: updates.status,
                timestamp: 'Just now',
                createdAt: new Date(),
              },
            ],
            $position: 0,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/tasks/:id
export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({
      _id: id,
      workspaceId: req.workspaceId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID '${id}' was not found in active workspace scope.`,
      });
    }

    await Workspace.findByIdAndUpdate(req.workspaceId, {
      $push: {
        activities: {
          $each: [
            {
              user: 'You',
              action: 'deleted task',
              target: task.title,
              timestamp: 'Just now',
              createdAt: new Date(),
            },
          ],
          $position: 0,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Task '${task.title}' was deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
}
