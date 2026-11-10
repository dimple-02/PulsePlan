import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Invitation } from '../models/Invitation.js';
import { Project } from '../models/Project.js';
import { Workspace } from '../models/Workspace.js';
import { User } from '../models/User.js';
import { sendProjectInviteEmail, sendWorkspaceInviteEmail } from '../services/emailService.js';
import { hashToken } from '../services/otpService.js';
import { ENV } from '../config/env.js';
import { areEmailsEqual, getEmailRegex } from '../utils/emailUtils.js';

const INVITATION_EXPIRY_DAYS = 7;
const INVITATION_EXPIRY_MS = INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// Helper: Strict role hierarchy (Owner > Admin > Member > Viewer)
function shouldUpgradeRole(currentRole, newRole) {
  const ranks = { Owner: 4, Admin: 3, Member: 2, Viewer: 1 };
  return (ranks[newRole] || 0) > (ranks[currentRole] || 0);
}

/**
 * Helper: Validates whether req.user has permission to manage invitations/collaborators for a project
 */
function canUserManageProject(user, workspaceRole, project) {
  if (workspaceRole === 'Owner' || workspaceRole === 'Admin') return true;
  if (project.lead === user.name) return true;
  const isCollabAdmin = project.collaborators?.some(
    (c) =>
      ((c.userId && c.userId.toString() === user._id.toString()) ||
        (c.email && areEmailsEqual(c.email, user.email))) &&
      c.role === 'Admin'
  );
  return Boolean(isCollabAdmin);
}

/**
 * POST /api/projects/:projectId/invitations
 *
 * Invites a collaborator by email to a project.
 * Security:
 * - Checks inviter's workspace and project RBAC permissions.
 * - Prevents privilege escalation (e.g. non-owners cannot assign Admin role unless permitted).
 * - Prevents duplicate invitations and duplicate project memberships.
 * - Generates cryptographically secure 32-byte token and stores SHA-256 hash.
 */
export async function createProjectInvitation(req, res, next) {
  try {
    const { projectId } = req.params;
    const { email, role = 'Member' } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Collaborator email address is required.',
      });
    }

    const validRoles = ['Admin', 'Member', 'Viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}.`,
      });
    }

    // 1. Resolve project within authorized workspace
    const project = await Project.findOne({
      _id: projectId,
      workspaceId: req.workspaceId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in the active workspace scope.',
      });
    }

    // 2. Validate inviter RBAC permissions
    const isAuthorized = canUserManageProject(req.user, req.workspaceRole, project);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied: You must be a workspace Owner/Admin or project Lead/Admin to invite collaborators.',
      });
    }

    // 3. Privilege Escalation Prevention
    // Only workspace Owners/Admins or the project Lead can invite another Admin
    if (role === 'Admin') {
      const isWorkspaceAdminOrOwner =
        req.workspaceRole === 'Owner' || req.workspaceRole === 'Admin';
      const isLead = project.lead === req.user.name;
      if (!isWorkspaceAdminOrOwner && !isLead) {
        return res.status(403).json({
          success: false,
          message:
            'Access denied: Only workspace administrators or the project lead can invite an Admin collaborator.',
        });
      }
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 4. Prevent self-invitation
    if (areEmailsEqual(normalizedEmail, req.user.email)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this project.',
      });
    }

    // 5. Prevent duplicate project membership
    const alreadyCollaborator = project.collaborators?.some(
      (c) => c.email && areEmailsEqual(c.email, normalizedEmail)
    );
    if (alreadyCollaborator) {
      return res.status(409).json({
        success: false,
        message: `A collaborator with email '${normalizedEmail}' is already part of this project.`,
      });
    }

    // 6. Prevent duplicate active pending invitations
    const emailRegex = getEmailRegex(normalizedEmail);
    const existingPending = await Invitation.findOne({
      projectId: project._id,
      email: { $regex: emailRegex },
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: `An invitation is already pending for '${normalizedEmail}'. You can resend the existing invitation instead.`,
        data: {
          invitationId: existingPending._id,
          status: existingPending.status,
          expiresAt: existingPending.expiresAt,
        },
      });
    }

    // 7. Generate cryptographically secure random token and hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

    // 8. Invalidate any previously expired or revoked records for clean state
    await Invitation.deleteMany({
      projectId: project._id,
      email: normalizedEmail,
      status: { $in: ['expired', 'revoked', 'rejected'] },
    });

    const invitation = await Invitation.create({
      type: 'project',
      email: normalizedEmail,
      projectId: project._id,
      workspaceId: req.workspaceId,
      inviterId: req.user._id,
      role,
      tokenHash,
      status: 'pending',
      expiresAt,
    });

    // 9. Dispatch invitation email in background
    const inviteUrl = `${ENV.CLIENT_URL}/invitations/${rawToken}`;
    sendProjectInviteEmail({
      to: normalizedEmail,
      recipientName: '',
      inviterName: req.user.name,
      projectName: project.name,
      workspaceName: req.workspace?.name || 'PulsePlan Workspace',
      role,
      inviteUrl,
      expiryDays: INVITATION_EXPIRY_DAYS,
    }).catch((err) => {
      console.error('[EmailService Error] Failed to send project invitation:', err.message);
    });

    // 10. Record activity in the workspace
    if (req.workspace) {
      req.workspace.activities.unshift({
        user: req.user.name,
        action: 'invited collaborator',
        target: `${normalizedEmail} to ${project.name}`,
        timestamp: 'Just now',
        createdAt: new Date(),
      });
      await req.workspace.save();
    }

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${normalizedEmail} successfully.`,
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:projectId/invitations
 *
 * Lists all invitations for a project. Automatically transitions expired pending invitations.
 */
export async function getProjectInvitations(req, res, next) {
  try {
    const { projectId } = req.params;

    // Verify project in tenant scope
    const project = await Project.findOne({
      _id: projectId,
      workspaceId: req.workspaceId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in current workspace.',
      });
    }

    // Auto-mark expired pending invitations
    await Invitation.updateMany(
      {
        projectId: project._id,
        status: 'pending',
        expiresAt: { $lte: new Date() },
      },
      { $set: { status: 'expired' } }
    );

    const invitations = await Invitation.find({
      projectId: project._id,
      workspaceId: req.workspaceId,
    })
      .populate('inviterId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/workspaces/:workspaceId/invitations
 *
 * Invites a member by email to a workspace.
 */
export async function createWorkspaceInvitation(req, res, next) {
  try {
    const workspaceId = req.params.workspaceId || req.params.id || req.workspaceId;
    const { email, role = 'Member' } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Member email address is required.',
      });
    }

    const validRoles = ['Owner', 'Admin', 'Member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}.`,
      });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found.',
      });
    }

    const callerMember = workspace.members?.find(
      (m) =>
        (m.userId && m.userId.toString() === req.user._id.toString()) ||
        (m.email && areEmailsEqual(m.email, req.user.email))
    );
    const userWsRole = req.user.workspaces?.find(
      (w) => w.workspaceId.toString() === workspace._id.toString()
    )?.role;
    const effectiveRole = callerMember?.role || userWsRole || req.workspaceRole || 'Member';

    const isOwnerOrAdmin = effectiveRole === 'Owner' || effectiveRole === 'Admin';
    if (!isOwnerOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only workspace Owners or Admins can invite members.',
      });
    }

    if (role === 'Owner' && effectiveRole !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only existing Owners can invite an Owner.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (areEmailsEqual(normalizedEmail, req.user.email)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this workspace.',
      });
    }

    const existingMember = workspace.members?.find(
      (m) => m.email && areEmailsEqual(m.email, normalizedEmail)
    );
    if (existingMember && existingMember.userId) {
      return res.status(409).json({
        success: false,
        message: `A member with email '${normalizedEmail}' is already active in this workspace.`,
      });
    }

    const emailRegex = getEmailRegex(normalizedEmail);
    const existingPending = await Invitation.findOne({
      workspaceId: workspace._id,
      projectId: null,
      email: { $regex: emailRegex },
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: `An invitation is already pending for '${normalizedEmail}'. You can resend the existing invitation instead.`,
        data: {
          invitationId: existingPending._id,
          status: existingPending.status,
          expiresAt: existingPending.expiresAt,
        },
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

    await Invitation.deleteMany({
      workspaceId: workspace._id,
      projectId: null,
      email: { $regex: emailRegex },
      status: { $in: ['expired', 'revoked', 'rejected'] },
    });

    const invitation = await Invitation.create({
      type: 'workspace',
      email: normalizedEmail,
      workspaceId: workspace._id,
      projectId: null,
      inviterId: req.user._id,
      role,
      tokenHash,
      status: 'pending',
      expiresAt,
    });

    if (!existingMember) {
      const registeredUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { email: { $regex: emailRegex } }],
      });
      const nameGuess = normalizedEmail.split('@')[0];
      workspace.members.push({
        name: nameGuess,
        email: normalizedEmail,
        role,
        avatar: nameGuess.slice(0, 2).toUpperCase(),
        status: registeredUser ? 'Active' : 'Offline',
        userId: registeredUser ? registeredUser._id : undefined,
      });
      workspace.membersCount = workspace.members.length;
    }

    workspace.activities.unshift({
      user: req.user.name,
      action: 'invited workspace member',
      target: `${normalizedEmail} as ${role}`,
      timestamp: 'Just now',
      createdAt: new Date(),
    });
    await workspace.save();

    const inviteUrl = `${ENV.CLIENT_URL}/invitations/${rawToken}`;
    sendWorkspaceInviteEmail({
      to: normalizedEmail,
      recipientName: '',
      inviterName: req.user.name,
      workspaceName: workspace.name,
      role,
      joinUrl: inviteUrl,
    }).catch((err) => {
      console.error('[EmailService Error] Failed to send workspace invitation:', err.message);
    });

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${normalizedEmail} successfully.`,
      data: {
        ...invitation.toObject(),
        token: rawToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/workspaces/:workspaceId/invitations
 *
 * Lists all invitations for a workspace. Automatically marks expired.
 */
export async function getWorkspaceInvitations(req, res, next) {
  try {
    const workspaceId = req.params.workspaceId || req.params.id || req.workspaceId;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found.',
      });
    }

    await Invitation.updateMany(
      {
        workspaceId,
        projectId: null,
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      { $set: { status: 'expired' } }
    );

    const invitations = await Invitation.find({
      workspaceId,
      projectId: null,
    })
      .sort({ createdAt: -1 })
      .populate('inviterId', 'name email avatar');

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:projectId/invitations/:invitationId/resend
 * (Also supports POST /api/invitations/:invitationId/resend)
 *
 * Regenerates invitation token, resets expiration to 7 days, and resends email.
 */
export async function resendInvitation(req, res, next) {
  try {
    const invitationId = req.params.invitationId || req.params.id;

    const invitation = await Invitation.findById(invitationId).populate(
      'projectId workspaceId'
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found.',
      });
    }

    const isProject = Boolean(invitation.projectId);
    let project = null;

    if (isProject) {
      project = await Project.findById(invitation.projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Associated project no longer exists.',
        });
      }

      const isAuthorized = canUserManageProject(req.user, req.workspaceRole, project);
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to resend this invitation.',
        });
      }
    } else {
      const workspace = invitation.workspaceId?._id
        ? invitation.workspaceId
        : await Workspace.findById(invitation.workspaceId);
      const callerMember = workspace?.members?.find(
        (m) =>
          (m.userId && m.userId.toString() === req.user._id.toString()) ||
          (m.email && areEmailsEqual(m.email, req.user.email))
      );
      const userWsRole = req.user.workspaces?.find(
        (w) => w.workspaceId.toString() === (workspace?._id || '').toString()
      )?.role;
      const effectiveRole = callerMember?.role || userWsRole || req.workspaceRole || 'Member';
      const isAuthorized = effectiveRole === 'Owner' || effectiveRole === 'Admin';
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Only workspace Owners or Admins can resend workspace invitations.',
        });
      }
    }

    // Generate new rawToken and hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    invitation.tokenHash = tokenHash;
    invitation.status = 'pending';
    invitation.expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);
    invitation.revokedAt = undefined;
    invitation.rejectedAt = undefined;
    await invitation.save();

    // Re-dispatch email
    const inviteUrl = `${ENV.CLIENT_URL}/invitations/${rawToken}`;
    if (isProject) {
      sendProjectInviteEmail({
        to: invitation.email,
        recipientName: '',
        inviterName: req.user.name,
        projectName: project.name,
        workspaceName: invitation.workspaceId?.name || 'PulsePlan Workspace',
        role: invitation.role,
        inviteUrl,
        expiryDays: INVITATION_EXPIRY_DAYS,
      }).catch((err) => {
        console.error('[EmailService Error] Failed to resend invitation:', err.message);
      });
    } else {
      sendWorkspaceInviteEmail({
        to: invitation.email,
        recipientName: '',
        inviterName: req.user.name,
        workspaceName: invitation.workspaceId?.name || 'PulsePlan Workspace',
        role: invitation.role,
        joinUrl: inviteUrl,
      }).catch((err) => {
        console.error('[EmailService Error] Failed to resend workspace invitation:', err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: `Invitation resent to ${invitation.email} successfully.`,
      data: {
        ...invitation.toObject(),
        token: rawToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:projectId/invitations/:invitationId/revoke
 * (Also supports POST /api/invitations/:invitationId/revoke)
 *
 * Revokes a pending project or workspace invitation.
 */
export async function revokeInvitation(req, res, next) {
  try {
    const invitationId = req.params.invitationId || req.params.id;

    const invitation = await Invitation.findById(invitationId).populate('projectId');
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found.',
      });
    }

    const isProject = Boolean(invitation.projectId);

    if (isProject) {
      const project = await Project.findById(invitation.projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Associated project no longer exists.',
        });
      }

      const isAuthorized = canUserManageProject(req.user, req.workspaceRole, project);
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to revoke this invitation.',
        });
      }
    } else {
      const workspace = invitation.workspaceId?._id
        ? invitation.workspaceId
        : await Workspace.findById(invitation.workspaceId);
      const callerMember = workspace?.members?.find(
        (m) =>
          (m.userId && m.userId.toString() === req.user._id.toString()) ||
          (m.email && areEmailsEqual(m.email, req.user.email))
      );
      const userWsRole = req.user.workspaces?.find(
        (w) => w.workspaceId.toString() === (workspace?._id || '').toString()
      )?.role;
      const effectiveRole = callerMember?.role || userWsRole || req.workspaceRole || 'Member';
      const isAuthorized = effectiveRole === 'Owner' || effectiveRole === 'Admin';
      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Only workspace Owners or Admins can revoke workspace invitations.',
        });
      }
    }

    if (invitation.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot revoke an invitation that has already been accepted.',
      });
    }

    invitation.status = 'revoked';
    invitation.revokedAt = new Date();
    await invitation.save();

    res.status(200).json({
      success: true,
      message: `Invitation for ${invitation.email} was revoked.`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/invitations/token/:token
 *
 * Public query endpoint for invitation acceptance page.
 * Returns sanitized invitation details or explicit expired/revoked status.
 */
export async function getInvitationByToken(req, res, next) {
  try {
    const { token } = req.params;

    if (!token || token.length < 16) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invitation link token.',
      });
    }

    const tokenHash = hashToken(token);

    const invitation = await Invitation.findOne({ tokenHash })
      .populate('projectId', 'name key description status')
      .populate('workspaceId', 'name slug color')
      .populate('inviterId', 'name email avatar');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or link has expired.',
      });
    }

    // Auto-mark expired
    if (invitation.status === 'pending' && new Date() > new Date(invitation.expiresAt)) {
      invitation.status = 'expired';
      await invitation.save();
    }

    const isProject = Boolean(invitation.projectId);

    // If not pending, return detailed metadata with status
    if (invitation.status !== 'pending') {
      return res.status(200).json({
        success: false,
        status: invitation.status,
        message: `This invitation has already been ${invitation.status}.`,
        data: {
          id: invitation._id,
          type: isProject ? 'project' : 'workspace',
          status: invitation.status,
          invitedEmail: invitation.email,
          role: invitation.role,
          projectName: isProject ? (invitation.projectId?.name || 'Project') : null,
          projectKey: isProject ? invitation.projectId?.key : null,
          workspaceName: invitation.workspaceId?.name || 'Workspace',
          workspaceSlug: invitation.workspaceId?.slug,
          inviterName: invitation.inviterId?.name || 'Team Lead',
        },
      });
    }

    res.status(200).json({
      success: true,
      status: 'pending',
      data: {
        id: invitation._id,
        type: isProject ? 'project' : 'workspace',
        status: invitation.status,
        invitedEmail: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        project: isProject ? {
          id: invitation.projectId?._id,
          name: invitation.projectId?.name,
          key: invitation.projectId?.key,
          description: invitation.projectId?.description,
          status: invitation.projectId?.status,
        } : null,
        workspace: {
          id: invitation.workspaceId?._id,
          name: invitation.workspaceId?.name,
          slug: invitation.workspaceId?.slug,
          color: invitation.workspaceId?.color,
        },
        inviter: {
          name: invitation.inviterId?.name,
          email: invitation.inviterId?.email,
          avatar: invitation.inviterId?.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/invitations/token/:token/accept
 *
 * Accepts an invitation (Project or Workspace).
 * Security:
 * - Requires authenticated session (requireAuth).
 * - Enforces exact email match: req.user.email === invitation.email.
 * - Adds collaborator to workspace if not already a member (tenant isolation preserved).
 * - Adds collaborator to project with exact role assigned by inviter (if project invite).
 * - Prevents duplicate project membership and duplicate acceptance.
 */
export async function acceptInvitation(req, res, next) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token is required.',
      });
    }

    const tokenHash = hashToken(token);
    const existing = await Invitation.findOne({ tokenHash });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or invalid link.',
      });
    }

    // Check expiration
    if (new Date() > new Date(existing.expiresAt)) {
      if (existing.status === 'pending' || existing.status === 'claimed') {
        await Invitation.updateOne({ _id: existing._id }, { $set: { status: 'expired' } });
      }
      return res.status(400).json({
        success: false,
        status: 'expired',
        message: 'This invitation has expired. Please request a new invitation from the administrator.',
      });
    }

    if (existing.status === 'accepted') {
      return res.status(400).json({
        success: false,
        status: 'accepted',
        message: 'This invitation has already been accepted.',
      });
    }

    if (['rejected', 'revoked', 'expired'].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        status: existing.status,
        message: `This invitation is no longer active (status: ${existing.status}).`,
      });
    }

    // STRICT EMAIL MATCH: Recipient user email MUST match invited email (supporting canonical Gmail dot/subaddress equivalence)
    const currentUserEmail = req.user.email.toLowerCase().trim();
    const invitedEmail = existing.email.toLowerCase().trim();

    if (!areEmailsEqual(currentUserEmail, invitedEmail)) {
      return res.status(403).json({
        success: false,
        message: `You are signed in as '${currentUserEmail}', but this invitation was sent to '${invitedEmail}'. Please switch accounts or log in with '${invitedEmail}' to accept.`,
      });
    }

    const workspace = await Workspace.findById(existing.workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'The associated workspace no longer exists.',
      });
    }

    const isProjectInvite = Boolean(existing.projectId);
    let project = null;

    if (isProjectInvite) {
      project = await Project.findById(existing.projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'The associated project no longer exists.',
        });
      }
    }

    // RECOVERABLE ATOMIC CLAIM WITH FENCING TOKEN (claimId)
    // Claim the invitation atomically so concurrent requests cannot race.
    // Recovers automatically if a previous process crashed while claimed (>30s).
    const CLAIM_TIMEOUT_MS = 30000;
    const claimExpiryThreshold = new Date(Date.now() - CLAIM_TIMEOUT_MS);
    const claimId = crypto.randomUUID();

    const claimedInvitation = await Invitation.findOneAndUpdate(
      {
        _id: existing._id,
        expiresAt: { $gt: new Date() },
        $or: [
          { status: 'pending' },
          { status: 'claimed', claimedAt: { $lt: claimExpiryThreshold } },
        ],
      },
      {
        $set: {
          status: 'claimed',
          claimedAt: new Date(),
          claimId,
        },
      },
      { new: true }
    );

    if (!claimedInvitation) {
      const current = await Invitation.findById(existing._id);
      return res.status(400).json({
        success: false,
        status: current?.status || 'accepted',
        message: current?.status === 'accepted'
          ? 'This invitation has already been accepted.'
          : 'This invitation is currently being processed by another request. Please try again.',
      });
    }

    // Check MongoDB replica set transaction support
    const topologyType = mongoose.connection.client?.topology?.description?.type;
    const supportsTransactions = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';

    // REQUIREMENT: Fail closed in production if transaction-capable replica set is unavailable
    if (ENV.IS_PRODUCTION && !supportsTransactions) {
      return res.status(503).json({
        success: false,
        code: 'TRANSACTIONS_UNAVAILABLE',
        message:
          'Production invitation acceptance requires a transaction-capable MongoDB replica set (e.g. MongoDB Atlas). Multi-document atomic consistency cannot be guaranteed on standalone topology.',
      });
    }

    let session = null;
    if (supportsTransactions) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    // State trackers for standalone compensation rollback (when transactions are unavailable)
    const userAlreadyHadWs = req.user.workspaces?.some(
      (w) => w.workspaceId.toString() === workspace._id.toString()
    );
    let addedMemberToWorkspace = false;
    let originalWorkspaceMemberRole = null;
    let addedCollaboratorToProject = false;
    let originalProjectCollaboratorRole = null;
    let addedWorkspaceToUser = false;

    // Compensating rollback for standalone mode when multi-document transactions cannot run
    const rollbackPartialMutations = async () => {
      try {
        if (addedMemberToWorkspace) {
          await Workspace.updateOne(
            { _id: workspace._id },
            {
              $pull: { members: { email: currentUserEmail } },
              $inc: { membersCount: -1 },
            }
          );
        } else if (originalWorkspaceMemberRole) {
          await Workspace.updateOne(
            { _id: workspace._id, 'members.email': currentUserEmail },
            { $set: { 'members.$.role': originalWorkspaceMemberRole } }
          );
        }

        if (isProjectInvite && project) {
          if (addedCollaboratorToProject) {
            await Project.updateOne(
              { _id: project._id },
              { $pull: { collaborators: { email: currentUserEmail } } }
            );
          } else if (originalProjectCollaboratorRole) {
            await Project.updateOne(
              { _id: project._id, 'collaborators.email': currentUserEmail },
              { $set: { 'collaborators.$.role': originalProjectCollaboratorRole } }
            );
          }
        }

        if (addedWorkspaceToUser) {
          await User.updateOne(
            { _id: req.user._id },
            { $pull: { workspaces: { workspaceId: workspace._id } } }
          );
        }
      } catch (cleanupErr) {
        console.error('[Invitation Acceptance Compensation Error]:', cleanupErr.message);
      }
    };

    // APPLY MEMBERSHIP UPDATES WITH SAFE TRANSACTION ROLLBACK (OR STANDALONE COMPENSATION)
    try {
      // Fencing check: verify this request still owns the active claim before making mutations
      const stillValidClaim = await Invitation.findOne(
        { _id: claimedInvitation._id, status: 'claimed', claimId },
        null,
        session ? { session } : {}
      );
      if (!stillValidClaim) {
        if (session) {
          await session.abortTransaction();
          await session.endSession();
          session = null;
        }
        return res.status(409).json({
          success: false,
          message: 'Invitation claim expired or was taken over by another request.',
        });
      }

      // 1. Synchronize Workspace Membership & Activity (Tenant Isolation)
      const existingMemberIndex = workspace.members?.findIndex(
        (m) =>
          (m.userId && m.userId.toString() === req.user._id.toString()) ||
          (m.email && areEmailsEqual(m.email, currentUserEmail))
      );

      const wsRole = isProjectInvite ? 'Member' : claimedInvitation.role;

      if (existingMemberIndex !== -1 && existingMemberIndex !== undefined) {
        originalWorkspaceMemberRole = workspace.members[existingMemberIndex].role;
        workspace.members[existingMemberIndex].userId = req.user._id;
        workspace.members[existingMemberIndex].status = 'Active';
        workspace.members[existingMemberIndex].name = req.user.name;
        // Never downgrade an existing higher workspace role
        if (!isProjectInvite && shouldUpgradeRole(originalWorkspaceMemberRole, claimedInvitation.role)) {
          workspace.members[existingMemberIndex].role = claimedInvitation.role;
        }
      } else {
        addedMemberToWorkspace = true;
        workspace.members.push({
          name: req.user.name,
          email: req.user.email,
          role: wsRole,
          avatar: req.user.avatar || 'U',
          status: 'Active',
          userId: req.user._id,
        });
      }
      workspace.membersCount = workspace.members.length;

      // Log workspace activity inside the same workspace update and transaction
      workspace.activities.unshift({
        user: req.user.name,
        action: isProjectInvite ? 'joined project via invitation' : 'joined workspace via invitation',
        target: isProjectInvite ? (project?.name || 'Project') : workspace.name,
        timestamp: 'Just now',
        createdAt: new Date(),
      });

      await workspace.save(session ? { session } : {});

      // Ensure workspace is linked in user.workspaces atomically
      addedWorkspaceToUser = !userAlreadyHadWs;
      await User.updateOne(
        {
          _id: req.user._id,
          'workspaces.workspaceId': { $ne: workspace._id },
        },
        {
          $push: {
            workspaces: {
              workspaceId: workspace._id,
              role: wsRole,
            },
          },
        },
        session ? { session } : {}
      );

      // If user had workspace with a lower role, upgrade if invitation granted higher role
      if (!isProjectInvite && claimedInvitation.role === 'Owner') {
        await User.updateOne(
          { _id: req.user._id, 'workspaces.workspaceId': workspace._id },
          { $set: { 'workspaces.$.role': 'Owner' } },
          session ? { session } : {}
        );
      } else if (!isProjectInvite && claimedInvitation.role === 'Admin') {
        await User.updateOne(
          { _id: req.user._id, workspaces: { $elemMatch: { workspaceId: workspace._id, role: 'Member' } } },
          { $set: { 'workspaces.$.role': 'Admin' } },
          session ? { session } : {}
        );
      }

      // 2. If Project Invitation, Synchronize Project Collaborators
      if (isProjectInvite && project) {
        if (!project.collaborators) {
          project.collaborators = [];
        }

        const existingCollabIndex = project.collaborators.findIndex(
          (c) =>
            (c.userId && c.userId.toString() === req.user._id.toString()) ||
            (c.email && areEmailsEqual(c.email, currentUserEmail))
        );

        if (existingCollabIndex !== -1) {
          originalProjectCollaboratorRole = project.collaborators[existingCollabIndex].role;
          project.collaborators[existingCollabIndex].userId = req.user._id;
          // Never downgrade an existing higher project collaborator role
          if (shouldUpgradeRole(originalProjectCollaboratorRole, claimedInvitation.role)) {
            project.collaborators[existingCollabIndex].role = claimedInvitation.role;
          }
          project.collaborators[existingCollabIndex].name = req.user.name;
          project.collaborators[existingCollabIndex].avatar = req.user.avatar || 'U';
        } else {
          addedCollaboratorToProject = true;
          project.collaborators.push({
            userId: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: claimedInvitation.role,
            avatar: req.user.avatar || 'U',
            joinedAt: new Date(),
          });
        }

        if (!project.members.includes(req.user.avatar)) {
          project.members.push(req.user.avatar);
        }

        await project.save(session ? { session } : {});
      }

      // 3. FINALIZE INVITATION AS ACCEPTED (Only if this request still owns the exact claimId!)
      const finalized = await Invitation.findOneAndUpdate(
        {
          _id: claimedInvitation._id,
          status: 'claimed',
          claimId,
        },
        {
          $set: {
            status: 'accepted',
            acceptedAt: new Date(),
          },
          $unset: {
            claimedAt: 1,
            claimId: 1,
          },
        },
        { new: true, ...(session ? { session } : {}) }
      );

      if (!finalized) {
        if (session) {
          await session.abortTransaction();
          await session.endSession();
          session = null;
        } else {
          await rollbackPartialMutations();
        }
        return res.status(409).json({
          success: false,
          message: 'Invitation claim expired or was superseded before acceptance could be finalized.',
        });
      }

      if (session) {
        await session.commitTransaction();
        await session.endSession();
        session = null;
      }

      res.status(200).json({
        success: true,
        message: isProjectInvite
          ? `You have successfully joined '${project.name}' as a ${claimedInvitation.role}.`
          : `You have successfully joined '${workspace.name}' as a ${claimedInvitation.role}.`,
        data: {
          type: isProjectInvite ? 'project' : 'workspace',
          projectId: project ? project._id : null,
          projectName: project ? project.name : null,
          workspaceId: workspace._id,
          workspaceName: workspace.name,
          role: claimedInvitation.role,
        },
      });
    } catch (err) {
      if (session) {
        try {
          await session.abortTransaction();
          await session.endSession();
          session = null;
        } catch (_) {}
      } else {
        await rollbackPartialMutations();
      }
      // SAFE ROLLBACK: Revert status to 'pending' ONLY IF this request still owns the claimId!
      // An expired request will match 0 documents and CANNOT roll back a newer request's claim.
      await Invitation.updateOne(
        { _id: claimedInvitation._id, status: 'claimed', claimId },
        { $set: { status: 'pending' }, $unset: { claimedAt: 1, claimId: 1 } }
      );
      throw err;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/invitations/token/:token/reject
 *
 * Declines an invitation.
 */
export async function rejectInvitation(req, res, next) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token is required.',
      });
    }

    const tokenHash = hashToken(token);
    const invitation = await Invitation.findOne({ tokenHash });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found.',
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation is no longer pending (status: ${invitation.status}).`,
      });
    }

    // Verify recipient email
    const currentUserEmail = req.user.email.toLowerCase().trim();
    if (!areEmailsEqual(currentUserEmail, invitation.email)) {
      return res.status(403).json({
        success: false,
        message: `You are signed in as '${currentUserEmail}', but this invitation was sent to '${invitation.email}'.`,
      });
    }

    invitation.status = 'rejected';
    invitation.rejectedAt = new Date();
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'You have declined the invitation.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:projectId/collaborators
 *
 * Fetches all active collaborators for a project.
 */
export async function getProjectCollaborators(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      workspaceId: req.workspaceId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in current workspace.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        lead: project.lead,
        collaborators: project.collaborators || [],
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/projects/:projectId/collaborators/:userIdOrEmail
 *
 * Removes a collaborator from a project.
 */
export async function removeProjectCollaborator(req, res, next) {
  try {
    const { projectId, userIdOrEmail } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      workspaceId: req.workspaceId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in current workspace.',
      });
    }

    const isAuthorized = canUserManageProject(req.user, req.workspaceRole, project);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to remove collaborators.',
      });
    }

    const lowerId = userIdOrEmail.toLowerCase().trim();
    const index = project.collaborators.findIndex(
      (c) =>
        (c.userId && c.userId.toString() === userIdOrEmail) ||
        (c.email && areEmailsEqual(c.email, lowerId))
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Collaborator '${userIdOrEmail}' was not found on this project.`,
      });
    }

    const removed = project.collaborators.splice(index, 1)[0];

    // Remove their avatar initials if no longer in collaborators
    const stillHasAvatar = project.collaborators.some((c) => c.avatar === removed.avatar);
    if (!stillHasAvatar) {
      project.members = project.members.filter((m) => m !== removed.avatar);
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: `Collaborator '${removed.name || removed.email}' removed from project.`,
      data: removed,
    });
  } catch (error) {
    next(error);
  }
}
