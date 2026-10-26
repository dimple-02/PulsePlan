import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Workspace } from '../models/Workspace.js';

/**
 * Project Controller
 * 
 * Enforces strict multi-tenant boundary checks:
 * All queries and modifications MUST match req.workspaceId.
 */

// GET /api/projects
export async function getProjects(req, res, next) {
  try {
    const filter = { workspaceId: req.workspaceId };

    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      const term = req.query.search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { key: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/projects/:id
export async function getProjectById(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ _id: id, workspaceId: req.workspaceId });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID '${id}' was not found in active workspace scope.`,
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/projects
export async function createProject(req, res, next) {
  try {
    const {
      name,
      key,
      description,
      status,
      priority,
      progress,
      budget,
      spent,
      startDate,
      deadline,
      lead,
      members,
      category,
    } = req.body;

    const generatedKey = (
      key ||
      name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() ||
      `PRJ${Math.floor(Math.random() * 900 + 100)}`
    ).toUpperCase();

    // Ensure key uniqueness within the tenant workspace
    const existingKey = await Project.findOne({
      workspaceId: req.workspaceId,
      key: generatedKey,
    });

    if (existingKey) {
      return res.status(409).json({
        success: false,
        message: `A project with key '${generatedKey}' already exists in this workspace.`,
      });
    }

    const project = await Project.create({
      workspaceId: req.workspaceId,
      name,
      key: generatedKey,
      description: description || '',
      status: status || 'Planning',
      priority: priority || 'Medium',
      progress: progress || 0,
      budget: budget || '$0',
      spent: spent || '$0',
      startDate: startDate || new Date().toISOString().split('T')[0],
      deadline: deadline || '',
      lead: lead || req.user?.name || 'Workspace Member',
      members: members || [req.user?.avatar || 'U'],
      category: category || 'General',
    });

    // Record activity in the parent workspace
    await Workspace.findByIdAndUpdate(req.workspaceId, {
      $push: {
        activities: {
          $each: [
            {
              user: req.user?.name || lead || 'You',
              action: 'created new project',
              target: project.name,
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
      message: 'Project created successfully.',
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/projects/:id
export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;

    const allowedUpdates = [
      'name',
      'description',
      'status',
      'priority',
      'progress',
      'budget',
      'spent',
      'deadline',
      'lead',
      'members',
      'category',
    ];

    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, workspaceId: req.workspaceId },
      updates,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID '${id}' was not found in active workspace scope.`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/projects/:id
export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;

    const project = await Project.findOneAndDelete({
      _id: id,
      workspaceId: req.workspaceId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID '${id}' was not found in active workspace scope.`,
      });
    }

    // Cascade delete: remove all tasks referencing this project
    await Task.deleteMany({ projectId: project._id, workspaceId: req.workspaceId });

    // Record deletion in workspace activity
    await Workspace.findByIdAndUpdate(req.workspaceId, {
      $push: {
        activities: {
          $each: [
            {
              user: 'You',
              action: 'removed project',
              target: project.name,
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
      message: `Project '${project.name}' and all its tasks were deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
}
