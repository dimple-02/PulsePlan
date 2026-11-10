import crypto from 'node:crypto';
import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Invitation } from '../models/Invitation.js';
import { sendWorkspaceInviteEmail } from '../services/mailService.js';
import { hashToken } from '../services/otpService.js';
import { ENV } from '../config/env.js';
import { areEmailsEqual, getEmailRegex } from '../utils/emailUtils.js';

/**
 * Helper to dynamically compute currentUserRole for a specific user
 */
function resolveCurrentUserRole(workspace, user) {
  if (!user) return 'Member';
  const member = workspace.members?.find(
    (m) =>
      (m.userId && m.userId.toString() === user._id.toString()) ||
      (m.email && areEmailsEqual(m.email, user.email))
  );
  if (member?.role) return member.role;
  const userWs = user.workspaces?.find(
    (w) => w.workspaceId.toString() === workspace._id.toString()
  );
  return userWs?.role || 'Member';
}

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
      const emailRegex = getEmailRegex(req.user.email);
      query = {
        $or: [
          { _id: { $in: userWorkspaceIds } },
          { 'members.userId': req.user._id },
          { 'members.email': { $regex: emailRegex } },
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

        const enhancedProjects = projects.map((p) => {
          const pTasks = tasks.filter((t) => t.projectId?.toString() === p._id.toString());
          const doneTasks = pTasks.filter((t) => t.status === 'done');
          const progress = pTasks.length > 0 ? Math.round((doneTasks.length / pTasks.length) * 100) : (p.progress || 0);
          const pObj = p.toJSON ? p.toJSON() : { ...p };
          pObj.progress = progress;
          return pObj;
        });

        const wsObj = ws.toJSON();
        wsObj.currentUserRole = resolveCurrentUserRole(ws, req.user);
        wsObj.projects = enhancedProjects;
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
            (m.email && areEmailsEqual(m.email, req.user.email))
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

    const enhancedProjects = projects.map((p) => {
      const pTasks = tasks.filter((t) => t.projectId?.toString() === p._id.toString());
      const doneTasks = pTasks.filter((t) => t.status === 'done');
      const progress = pTasks.length > 0 ? Math.round((doneTasks.length / pTasks.length) * 100) : (p.progress || 0);
      const pObj = p.toJSON ? p.toJSON() : { ...p };
      pObj.progress = progress;
      return pObj;
    });

    const result = workspace.toJSON();
    result.currentUserRole = resolveCurrentUserRole(workspace, req.user);
    result.projects = enhancedProjects;
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
          createdAt: new Date(),
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
              (m.email && areEmailsEqual(m.email, req.user.email))) &&
            (m.role === 'Owner' || m.role === 'Admin')
        );

      if (!isOwnerOrAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Only workspace Owners or Admins are authorized to update workspace settings.',
        });
      }
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
              (m.email && areEmailsEqual(m.email, req.user.email))) &&
            (m.role === 'Owner' || m.role === 'Admin')
        );

      if (!isOwnerOrAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Only workspace Owners or Admins are authorized to update workspace settings.',
        });
      }
    }

    const allowedUpdates = ['name', 'plan', 'color', 'badgeColor', 'description'];
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
              (m.email && areEmailsEqual(m.email, req.user.email))) &&
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

// POST /api/workspaces/:id/members
export async function addWorkspaceMember(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: `Workspace with ID '${id}' not found.`,
      });
    }

    // Role-Based Access Control: Only Owners and Admins can add members
    const isOwnerOrAdmin =
      req.user.workspaces?.some(
        (w) => w.workspaceId.toString() === workspace._id.toString() && (w.role === 'Owner' || w.role === 'Admin')
      ) ||
      workspace.members?.some(
        (m) =>
          ((m.userId && m.userId.toString() === req.user._id.toString()) ||
            (m.email && areEmailsEqual(m.email, req.user.email))) &&
          (m.role === 'Owner' || m.role === 'Admin')
      );

    if (!isOwnerOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only workspace Owners or Admins are authorized to add members.',
      });
    }

    // Privilege Escalation Prevention: Only Owners can grant the Owner role
    if (role === 'Owner') {
      const isOwner =
        req.user.workspaces?.some(
          (w) => w.workspaceId.toString() === workspace._id.toString() && w.role === 'Owner'
        ) ||
        workspace.members?.some(
          (m) =>
            ((m.userId && m.userId.toString() === req.user._id.toString()) ||
              (m.email && areEmailsEqual(m.email, req.user.email))) &&
            m.role === 'Owner'
        );

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Only existing Owners can grant the Owner role to another user.',
        });
      }
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if member already exists in this workspace
    const existingMember = workspace.members.find(
      (m) => m.email && areEmailsEqual(m.email, normalizedEmail)
    );
    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: `A member with email '${normalizedEmail}' is already part of this workspace.`,
      });
    }

    // Check if user account already exists in MongoDB with this email
    const emailRegex = getEmailRegex(normalizedEmail);
    const registeredUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { email: { $regex: emailRegex } }],
    });

    const initials =
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    const newMember = {
      name: name.trim(),
      email: normalizedEmail,
      role: role || 'Member',
      avatar: initials,
      status: registeredUser ? 'Active' : 'Offline',
      userId: registeredUser ? registeredUser._id : undefined,
    };

    workspace.members.push(newMember);
    workspace.membersCount = workspace.members.length;
    workspace.activities.unshift({
      user: req.user ? req.user.name : 'You',
      action: 'added new member',
      target: newMember.name,
      timestamp: 'Just now',
      createdAt: new Date(),
    });

    await workspace.save();

    // If user account exists, link this workspace to their account profile atomically
    if (registeredUser) {
      await User.updateOne(
        {
          _id: registeredUser._id,
          'workspaces.workspaceId': { $ne: workspace._id },
        },
        {
          $push: {
            workspaces: {
              workspaceId: workspace._id,
              role: newMember.role,
            },
          },
        }
      );

      // Upgrade role if newMember.role is higher (Owner > Admin > Member) without downgrading
      if (newMember.role === 'Owner') {
        await User.updateOne(
          { _id: registeredUser._id, 'workspaces.workspaceId': workspace._id },
          { $set: { 'workspaces.$.role': 'Owner' } }
        );
      } else if (newMember.role === 'Admin') {
        await User.updateOne(
          { _id: registeredUser._id, workspaces: { $elemMatch: { workspaceId: workspace._id, role: 'Member' } } },
          { $set: { 'workspaces.$.role': 'Admin' } }
        );
      }
    }

    // Generate secure invitation token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Invitation.deleteMany({
      workspaceId: workspace._id,
      projectId: null,
      email: { $regex: emailRegex },
      status: { $in: ['expired', 'revoked', 'rejected'] },
    });

    await Invitation.create({
      type: 'workspace',
      email: normalizedEmail,
      workspaceId: workspace._id,
      projectId: null,
      inviterId: req.user ? req.user._id : workspace.members[0]?.userId,
      role: newMember.role,
      tokenHash,
      status: 'pending',
      expiresAt,
    });

    const joinUrl = `${ENV.CLIENT_URL}/invitations/${rawToken}`;

    // Send member invitation email in background
    sendWorkspaceInviteEmail({
      to: newMember.email,
      recipientName: newMember.name,
      inviterName: req.user ? req.user.name : 'Team Administrator',
      workspaceName: workspace.name,
      role: newMember.role,
      joinUrl,
    }).catch((err) => {
      console.error('[MailService Error]: Failed to dispatch member invitation:', err.message);
    });

    res.status(201).json({
      success: true,
      message: `Member '${name}' added to workspace successfully.`,
      data: workspace.members[workspace.members.length - 1],
    });
  } catch (error) {
    next(error);
  }
}


// DELETE /api/workspaces/:id/members/:memberId
export async function removeWorkspaceMember(req, res, next) {
  try {
    const { id, memberId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: `Workspace with ID '${id}' not found.`,
      });
    }

    // Role-Based Access Control: Only Owners and Admins can remove members
    const isOwnerOrAdmin =
      req.user.workspaces?.some(
        (w) => w.workspaceId.toString() === workspace._id.toString() && (w.role === 'Owner' || w.role === 'Admin')
      ) ||
      workspace.members?.some(
        (m) =>
          ((m.userId && m.userId.toString() === req.user._id.toString()) ||
            (m.email && areEmailsEqual(m.email, req.user.email))) &&
          (m.role === 'Owner' || m.role === 'Admin')
      );

    if (!isOwnerOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only workspace Owners or Admins are authorized to remove members.',
      });
    }

    // Find member by _id or email
    const memberIndex = workspace.members.findIndex(
      (m) => m._id.toString() === memberId || (m.email && areEmailsEqual(m.email, memberId))
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Member with ID or email '${memberId}' not found in workspace.`,
      });
    }

    const memberToRemove = workspace.members[memberIndex];

    // Security check: Prevent removing the sole Owner
    if (memberToRemove.role === 'Owner') {
      const ownerCount = workspace.members.filter((m) => m.role === 'Owner').length;
      if (ownerCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the primary Workspace Owner. Transfer ownership first.',
        });
      }
    }

    // Remove from array
    workspace.members.splice(memberIndex, 1);
    workspace.membersCount = workspace.members.length;

    // Record activity
    workspace.activities.unshift({
      user: req.user ? req.user.name : 'You',
      action: 'removed member',
      target: memberToRemove.name,
      timestamp: 'Just now',
      createdAt: new Date(),
    });

    await workspace.save();

    // If member has registered user account, unlink workspace
    if (memberToRemove.userId) {
      await User.findByIdAndUpdate(memberToRemove.userId, {
        $pull: { workspaces: { workspaceId: workspace._id } },
      });
    }

    res.status(200).json({
      success: true,
      message: `Member '${memberToRemove.name}' was removed from the workspace.`,
      data: {
        memberId: memberToRemove._id,
        email: memberToRemove.email,
      },
    });
  } catch (error) {
    next(error);
  }
}
