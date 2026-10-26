import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';

/**
 * Workspace Controller
 * 
 * Handles CRUD operations for tenant organizations.
 */

// GET /api/workspaces
export async function getWorkspaces(req, res, next) {
  try {
    const workspaces = await Workspace.find().sort({ createdAt: -1 });

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
        name: 'Alex Morgan',
        email: 'alex.m@acme.io',
        role: 'Owner',
        avatar: 'AM',
        status: 'Active',
      },
    ];

    const workspace = await Workspace.create({
      name,
      slug: formattedSlug,
      plan: plan || 'Starter',
      color: color || '#4f46e5',
      badgeColor: badgeColor || 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: description || '',
      currentUserRole: currentUserRole || 'Workspace Admin',
      membersCount: defaultMembers.length,
      members: defaultMembers,
      activities: [
        {
          user: 'You',
          action: 'created workspace',
          target: name,
          timestamp: 'Just now',
        },
      ],
    });

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
    const allowedUpdates = ['name', 'plan', 'color', 'badgeColor', 'description', 'currentUserRole'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const workspace = await Workspace.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: `Workspace with ID '${id}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully.',
      data: workspace,
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

    // Cascade delete: remove all projects and tasks belonging to this workspace
    await Promise.all([
      Project.deleteMany({ workspaceId: workspace._id }),
      Task.deleteMany({ workspaceId: workspace._id }),
      Workspace.findByIdAndDelete(workspace._id),
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
