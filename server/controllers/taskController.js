
// Helper to synchronize project completion rate based on task statuses
async function recalculateProjectProgress(projectId, workspaceId) {
  if (!projectId || !workspaceId) return;
  try {
    const tasks = await Task.find({ projectId, workspaceId });
    const doneCount = tasks.filter((t) => t.status === 'done').length;
    const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
    await Project.findByIdAndUpdate(projectId, { progress });
  } catch (err) {
    console.error('[RecalculateProjectProgress Error]:', err.message);
  }
}

import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Workspace } from '../models/Workspace.js';
import mongoose from 'mongoose';
import { sendTaskAssignmentEmail } from '../services/mailService.js';
import { areEmailsEqual } from '../utils/emailUtils.js';

// Helper: Check whether user can access a project within their authorized workspace
function canUserAccessProject(user, workspaceRole, project) {
  if (!user || !project) return false;
  if (workspaceRole === 'Owner' || workspaceRole === 'Admin') return true;
  if (project.lead === user.name) return true;
  const isCollab = project.collaborators?.some(
    (c) =>
      (c.userId && c.userId.toString() === user._id.toString()) ||
      (c.email && areEmailsEqual(c.email, user.email))
  );
  if (isCollab) return true;
  return !project.collaborators || project.collaborators.length === 0;
}

// Helper: Retrieve project-specific role for a user
function getUserProjectRole(user, project) {
  if (!user || !project) return null;
  const collab = project.collaborators?.find(
    (c) =>
      (c.userId && c.userId.toString() === user._id.toString()) ||
      (c.email && areEmailsEqual(c.email, user.email))
  );
  return collab?.role || null;
}

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

      if (req.user && !canUserAccessProject(req.user, req.workspaceRole, projectExists)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view tasks in this project.',
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

    let tasks = await Task.find(filter).sort({ createdAt: -1 });

    // If no specific projectId filter was requested, filter out tasks from restricted projects
    const isWorkspaceAdminOrOwner =
      req.workspaceRole === 'Owner' || req.workspaceRole === 'Admin';
    if (req.user && !isWorkspaceAdminOrOwner && !req.query.projectId) {
      const allowedProjects = await Project.find({ workspaceId: req.workspaceId });
      const accessibleProjectIds = new Set(
        allowedProjects
          .filter((p) => canUserAccessProject(req.user, req.workspaceRole, p))
          .map((p) => p._id.toString())
      );
      tasks = tasks.filter((t) => accessibleProjectIds.has(t.projectId?.toString()));
    }

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
    // Syllabus Demonstration: Mongoose Relationships & References (.populate)
    // Resolves the foreign key reference task.projectId -> Project document
    const task = await Task.findOne({ _id: id, workspaceId: req.workspaceId })
      .populate('projectId', 'name key category lead collaborators');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID '${id}' was not found in active workspace scope.`,
      });
    }

    if (task.projectId && req.user) {
      const hasAccess = canUserAccessProject(req.user, req.workspaceRole, task.projectId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view this task.',
        });
      }
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

    // RBAC: Check project role
    if (req.user) {
      const isWorkspaceAdminOrOwner =
        req.workspaceRole === 'Owner' || req.workspaceRole === 'Admin';
      const collab = project.collaborators?.find(
        (c) =>
          (c.userId && c.userId.toString() === req.user._id.toString()) ||
          (c.email && areEmailsEqual(c.email, req.user.email))
      );
      if (collab?.role === 'Viewer') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Project viewers have read-only access and cannot create tasks.',
        });
      }
      const isLead = project.lead === req.user.name;
      const isOpen = !project.collaborators || project.collaborators.length === 0;
      if (!isWorkspaceAdminOrOwner && !isLead && !collab && !isOpen) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You must be a project member to create tasks in this project.',
        });
      }
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
    await recalculateProjectProgress(project._id, req.workspaceId);
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

    // Dispatch task assignment email if assigned to a team member
    if (task.assignee?.name) {
      Workspace.findById(req.workspaceId).then((ws) => {
        const member = ws?.members?.find(
          (m) => m.name.toLowerCase() === task.assignee.name.toLowerCase()
        );
        if (member?.email && !areEmailsEqual(member.email, req.user?.email)) {
          sendTaskAssignmentEmail({
            to: member.email,
            recipientName: member.name,
            taskTitle: task.title,
            projectName: project.name,
            priority: task.priority,
            dueDate: task.dueDate,
          }).catch((err) => {
            console.error('[MailService Error]: Failed to dispatch task assignment email:', err.message);
          });
        }
      }).catch(() => {});
    }

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

    // RBAC: Check project role & permissions
    if (req.user) {
      const taskProject = await Project.findById(existingTask.projectId);
      if (taskProject) {
        const hasAccess = canUserAccessProject(req.user, req.workspaceRole, taskProject);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You do not have permission to modify tasks in this project.',
          });
        }
        const collabRole = getUserProjectRole(req.user, taskProject);
        if (collabRole === 'Viewer') {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Project viewers have read-only access and cannot modify tasks.',
          });
        }
      }
    }

    // If projectId is being updated, verify target project also belongs to same workspace and user has permission
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

      // Check user permission on target project
      if (req.user) {
        const hasTargetAccess = canUserAccessProject(req.user, req.workspaceRole, targetProject);
        if (!hasTargetAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You do not have permission to move tasks into the target project.',
          });
        }
        const targetCollabRole = getUserProjectRole(req.user, targetProject);
        if (targetCollabRole === 'Viewer') {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Project viewers have read-only access and cannot add or move tasks into the target project.',
          });
        }
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

    await recalculateProjectProgress(updatedTask.projectId, req.workspaceId);
    if (existingTask.projectId.toString() !== updatedTask.projectId.toString()) {
      await recalculateProjectProgress(existingTask.projectId, req.workspaceId);
    }

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

    const task = await Task.findOne({
      _id: id,
      workspaceId: req.workspaceId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID '${id}' was not found in active workspace scope.`,
      });
    }

    // RBAC: Check project role & permissions
    if (req.user) {
      const taskProject = await Project.findById(task.projectId);
      if (taskProject) {
        const hasAccess = canUserAccessProject(req.user, req.workspaceRole, taskProject);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You do not have permission to delete tasks in this project.',
          });
        }
        const collabRole = getUserProjectRole(req.user, taskProject);
        if (collabRole === 'Viewer') {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Project viewers have read-only access and cannot delete tasks.',
          });
        }
      }
    }

    await Task.findByIdAndDelete(task._id);

    await recalculateProjectProgress(task.projectId, req.workspaceId);

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
