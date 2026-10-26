import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';

/**
 * Workspace Controller
 * 
 * Handles CRUD operations for tenant organizations.
 */

// GET /api/workspaces
export async function getWorkspaces(req, res, next) {
  try {
    let query = {};

    // Multi-tenant isolation: If user is authenticated, return ONLY workspaces
    // where user is explicitly in user.workspaces or workspace.members
    if (req.user) {
      const userWorkspaceIds = (req.user.workspaces || []).map((w) => w.workspaceId);
      query = {
        $or: [
          { _id: { $in: userWorkspaceIds } },
          { 'members.userId': req.user._id },
          { 'members.email': req.user.email.toLowerCase() },
        ],
      };
    }

    const workspaces = await Workspace.find(query).sort({ createdAt: -1 });

    // Fetch projects and tasks for each workspace so frontend gets full state
    const enhanced = await Promise.all(
      workspaces.map(async (ws) => {
        const [projects, tasks] = await Promise.all([
          Project.find({ workspaceId: ws._id }).sort({ createdAt: -1 }),
          Task.find({ workspaceId: ws._id }).sort({ createdAt: -1 }),
        ]);

        const wsObj = ws.toJSON();
        wsObj.projects = projects;
        wsObj.tasks = tasks;
        return wsObj;
      })
    );

    res.status(200).json({
      success: true,
      count: enhanced.length,
      data: enhanced,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/workspaces/:id
export async function getWorkspaceById(req, res, next) {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: `Workspace with ID '${id}' not found.`,
      });
    }

    // Server-side authorization check: User must be a member of this workspace
    if (req.user) {
      const isMember =
        req.user.workspaces?.some((w) => w.workspaceId.toString() === workspace._id.toString()) ||
        workspace.members?.some(
          (m) =>
            (m.userId && m.userId.toString() === req.user._id.toString()) ||
            (m.email && m.email.toLowerCase() === req.user.email.toLowerCase())
        );

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: `Access denied: You are not authorized to view workspace '${workspace.name}'.`,
        });
      }
    }

    const [projects, tasks] = await Promise.all([
      Project.find({ workspaceId: workspace._id }).sort({ createdAt: -1 }),
      Task.find({ workspaceId: workspace._id }).sort({ createdAt: -1 }),
    ]);

    const result = workspace.toJSON();
    result.projects = projects;
    result.tasks = tasks;

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/workspaces
export async function createWorkspace(req, res, next) {
  try {
    const { name, slug, plan, color, badgeColor, description, currentUserRole, members } = req.body;

    const formattedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');

    const existing = await Workspace.findOne({ slug: formattedSlug });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A workspace with slug '${formattedSlug}' already exists. Please pick a unique slug.`,
      });
    }

    const defaultMembers = members && members.length > 0 ? members : [
      {
        name: req.user ? req.user.name : 'Workspace Admin',
        email: req.user ? req.user.email : 'admin@pulseplan.io',
        role: 'Owner',
        avatar: req.user?.avatar || 'U',
        status: 'Active',
        userId: req.user ? req.user._id : undefined,
      },
    ];

    const workspace = await Workspace.create({
      name,
      slug: formattedSlug,
      plan: plan || 'Starter',
      color: color || '#4f46e5',
      badgeColor: badgeColor || 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: description || '',
      currentUserRole: currentUserRole || 'Owner',
      membersCount: defaultMembers.length,
      members: defaultMembers,
      activities: [
        {
          user: req.user ? req.user.name : 'You',
          action: 'created workspace',
          target: name,
          timestamp: 'Just now',
        },
      ],
    });

    // Link workspace to creator's user account
    if (req.user) {
      req.user.workspaces.push({
        workspaceId: workspace._id,
        role: 'Owner',
      });
      await req.user.save();
    }

    const result = workspace.toJSON();
    result.projects = [];
    result.tasks = [];

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/workspaces/:id
export async function updateWorkspace(req, res, next) {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: `Workspace with ID '${id}' not found.`,
      });
    }

    // Role check: Only Owner or Admin can update workspace settings
    if (req.user) {
      const isOwnerOrAdmin =
        req.user.workspaces?.some(
          (w) => w.workspaceId.toString() === workspace._id.toString() && (w.role === 'Owner' || w.role === 'Admin')
        ) ||
        workspace.members?.some(
          (m) =>
            ((m.userId && m.userId.toString() === req.user._id.toString()) ||
              (m.email && m.email.toLowerCase() === req.user.email.toLowerCase())) &&
            (m.role === 'Owner' || m.role === 'Admin')
        );

      if (!isOwnerOrAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Only workspace Owners or Admins are authorized to update workspace settings.',
        });
      }
    }

    const allowedUpdates = ['name', 'plan', 'color', 'badgeColor', 'description', 'currentUserRole'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updated = await Workspace.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/workspaces/:id
export async function deleteWorkspace(req, res, next) {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: `Workspace with ID '${id}' not found.`,
      });
    }

    // Role check: Only Owner or Admin can delete a workspace
    if (req.user) {
      const isOwnerOrAdmin =
        req.user.workspaces?.some(
          (w) => w.workspaceId.toString() === workspace._id.toString() && (w.role === 'Owner' || w.role === 'Admin')
        ) ||
        workspace.members?.some(
          (m) =>
            ((m.userId && m.userId.toString() === req.user._id.toString()) ||
              (m.email && m.email.toLowerCase() === req.user.email.toLowerCase())) &&
            (m.role === 'Owner' || m.role === 'Admin')
        );

      if (!isOwnerOrAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Only workspace Owners or Admins are authorized to delete this workspace.',
        });
      }
    }

    // Cascade delete: remove all projects and tasks belonging to this workspace, and clean user references
    await Promise.all([
      Project.deleteMany({ workspaceId: workspace._id }),
      Task.deleteMany({ workspaceId: workspace._id }),
      Workspace.findByIdAndDelete(workspace._id),
      User.updateMany(
        { 'workspaces.workspaceId': workspace._id },
        { $pull: { workspaces: { workspaceId: workspace._id } } }
      ),
    ]);

    res.status(200).json({
      success: true,
      message: `Workspace '${workspace.name}' and all associated projects and tasks were deleted.`,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/workspaces/seed
// Seed initial 3 workspaces cleanly into MongoDB
export async function seedWorkspaces(req, res, next) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Database seeding endpoint is disabled in production environments.',
      });
    }
    const seedData = [
      {
        name: 'Acme Cloud Innovations',
        slug: 'acme-cloud',
        plan: 'Enterprise',
        color: '#4f46e5',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        description: 'Enterprise workspace for cloud infrastructure, core platform services, and devops tooling.',
        membersCount: 5,
        currentUserRole: 'Workspace Admin',
        members: [
          { name: 'Alex Morgan', email: 'alex.m@acme.io', role: 'Owner', avatar: 'AM', status: 'Active' },
          { name: 'Priya Sharma', email: 'priya.s@acme.io', role: 'Admin', avatar: 'PS', status: 'Active' },
          { name: 'David Kim', email: 'david.k@acme.io', role: 'Member', avatar: 'DK', status: 'Active' },
          { name: 'Sarah Chen', email: 'sarah.c@acme.io', role: 'Member', avatar: 'SC', status: 'Offline' },
          { name: 'Marcus Reed', email: 'marcus.r@acme.io', role: 'Member', avatar: 'MR', status: 'Active' },
        ],
        activities: [],
      },
      {
        name: 'Nexus FinTech Labs',
        slug: 'nexus-fintech',
        plan: 'Pro Team',
        color: '#059669',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        description: 'Fintech workspace dedicated to cross-border settlement, compliance rails, and algorithmic fraud detection.',
        membersCount: 3,
        currentUserRole: 'Product Manager',
        members: [
          { name: 'Elena Rostova', email: 'elena@nexusfin.com', role: 'Owner', avatar: 'ER', status: 'Active' },
          { name: 'Zack Taylor', email: 'zack@nexusfin.com', role: 'Admin', avatar: 'ZT', status: 'Active' },
          { name: 'Kavita Patel', email: 'kavita@nexusfin.com', role: 'Member', avatar: 'KP', status: 'Offline' },
        ],
        activities: [],
      },
      {
        name: 'Studio Zero Digital',
        slug: 'studio-zero',
        plan: 'Starter',
        color: '#d97706',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        description: 'Boutique creative agency workspace for branding, UX prototypes, and mobile app design.',
        membersCount: 2,
        currentUserRole: 'Lead Designer',
        members: [
          { name: 'Liam Vance', email: 'liam@studiozero.design', role: 'Owner', avatar: 'LV', status: 'Active' },
          { name: 'Chloe Bennett', email: 'chloe@studiozero.design', role: 'Member', avatar: 'CB', status: 'Active' },
        ],
        activities: [],
      },
    ];

    const results = [];
    for (const ws of seedData) {
      let doc = await Workspace.findOne({ slug: ws.slug });
      if (!doc) {
        doc = await Workspace.create(ws);
      }
      results.push(doc);
    }

    res.status(200).json({
      success: true,
      message: 'Default workspaces seeded into MongoDB successfully.',
      data: results,
    });
  } catch (error) {
    next(error);
  }
}
