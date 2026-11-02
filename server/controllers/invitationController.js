import crypto from 'node:crypto';
import { Invitation } from '../models/Invitation.js';
import { Project } from '../models/Project.js';
import { Workspace } from '../models/Workspace.js';
import { User } from '../models/User.js';
import { sendProjectInviteEmail } from '../services/emailService.js';
import { hashToken } from '../services/otpService.js';
import { ENV } from '../config/env.js';

const INVITATION_EXPIRY_DAYS = 7;
const INVITATION_EXPIRY_MS = INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * Helper: Validates whether req.user has permission to manage invitations/collaborators for a project
 */
function canUserManageProject(user, workspaceRole, project) {
  if (workspaceRole === 'Owner' || workspaceRole === 'Admin') return true;
  if (project.lead === user.name) return true;
  const isCollabAdmin = project.collaborators?.some(
    (c) =>
      ((c.userId && c.userId.toString() === user._id.toString()) ||
        c.email?.toLowerCase() === user.email.toLowerCase()) &&
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
    if (normalizedEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this project.',
      });
    }

    // 5. Prevent duplicate project membership
    const alreadyCollaborator = project.collaborators?.some(
      (c) => c.email?.toLowerCase() === normalizedEmail
    );
    if (alreadyCollaborator) {
      return res.status(409).json({
        success: false,
        message: `A collaborator with email '${normalizedEmail}' is already part of this project.`,
      });
    }

    // 6. Prevent duplicate active pending invitations
    const existingPending = await Invitation.findOne({
      projectId: project._id,
      email: normalizedEmail,
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

    // Authorization: User must be a member of the workspace with permission
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
        message: 'Access denied: You do not have permission to resend this invitation.',
      });
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

    res.status(200).json({
      success: true,
      message: `Invitation resent to ${invitation.email} successfully.`,
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:projectId/invitations/:invitationId/revoke
 * (Also supports POST /api/invitations/:invitationId/revoke)
 *
 * Revokes a pending project invitation.
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

    // If not pending, return detailed metadata with status
    if (invitation.status !== 'pending') {
      return res.status(200).json({
        success: false,
        status: invitation.status,
        message: `This invitation has already been ${invitation.status}.`,
        data: {
          id: invitation._id,
          status: invitation.status,
          invitedEmail: invitation.email,
          role: invitation.role,
          projectName: invitation.projectId?.name || 'Project',
          projectKey: invitation.projectId?.key,
          workspaceName: invitation.workspaceId?.name || 'Workspace',
          inviterName: invitation.inviterId?.name || 'Team Lead',
        },
      });
    }

    res.status(200).json({
      success: true,
      status: 'pending',
      data: {
        id: invitation._id,
        status: invitation.status,
        invitedEmail: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        project: {
          id: invitation.projectId?._id,
          name: invitation.projectId?.name,
          key: invitation.projectId?.key,
          description: invitation.projectId?.description,
          status: invitation.projectId?.status,
        },
        workspace: {
          id: invitation.workspaceId?._id,
          name: invitation.workspaceId?.name,
          slug: invitation.workspaceId?.slug,
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
 * Accepts an invitation.
 * Security:
 * - Requires authenticated session (requireAuth).
 * - Enforces exact email match: req.user.email === invitation.email.
 * - Adds collaborator to workspace if not already a member (tenant isolation preserved).
 * - Adds collaborator to project with exact role assigned by inviter.
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
    const invitation = await Invitation.findOne({ tokenHash });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or invalid link.',
      });
    }

    // Check expiration
    if (new Date() > new Date(invitation.expiresAt)) {
      if (invitation.status === 'pending') {
        invitation.status = 'expired';
        await invitation.save();
      }
      return res.status(400).json({
        success: false,
        status: 'expired',
        message: 'This invitation has expired. Please request a new invitation from the project administrator.',
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        status: invitation.status,
        message: `This invitation is no longer active (status: ${invitation.status}).`,
      });
    }

    // STRICT EMAIL MATCH: Recipient user email MUST match invited email
    const currentUserEmail = req.user.email.toLowerCase().trim();
    const invitedEmail = invitation.email.toLowerCase().trim();

    if (currentUserEmail !== invitedEmail) {
      return res.status(403).json({
        success: false,
        message: `You are signed in as '${currentUserEmail}', but this invitation was sent to '${invitedEmail}'. Please switch accounts or log in with '${invitedEmail}' to accept.`,
      });
    }

    // Fetch target project and workspace
    const project = await Project.findById(invitation.projectId);
    const workspace = await Workspace.findById(invitation.workspaceId);

    if (!project || !workspace) {
      return res.status(404).json({
        success: false,
        message: 'The associated project or workspace no longer exists.',
      });
    }

    // 1. Synchronize Workspace Membership (Tenant Isolation)
    // Collaborator MUST be authorized in the workspace to view project resources
    const isMemberInWorkspace = workspace.members?.some(
      (m) =>
        (m.userId && m.userId.toString() === req.user._id.toString()) ||
        (m.email && m.email.toLowerCase() === currentUserEmail)
    );

    if (!isMemberInWorkspace) {
      workspace.members.push({
        name: req.user.name,
        email: req.user.email,
        role: 'Member', // Safe default workspace role
        avatar: req.user.avatar || 'U',
        status: 'Active',
        userId: req.user._id,
      });
      workspace.membersCount = workspace.members.length;
      await workspace.save();
    }

    // Ensure workspace is linked in user.workspaces
    const isLinkedToUser = req.user.workspaces?.some(
      (w) => w.workspaceId.toString() === workspace._id.toString()
    );
    if (!isLinkedToUser) {
      req.user.workspaces.push({
        workspaceId: workspace._id,
        role: 'Member',
      });
      await req.user.save();
    }

    // 2. Synchronize Project Collaborators
    if (!project.collaborators) {
      project.collaborators = [];
    }

    const alreadyInProject = project.collaborators.some(
      (c) =>
        (c.userId && c.userId.toString() === req.user._id.toString()) ||
        (c.email && c.email.toLowerCase() === currentUserEmail)
    );

    if (!alreadyInProject) {
      project.collaborators.push({
        userId: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: invitation.role, // Exact role designated by inviter
        avatar: req.user.avatar || 'U',
        joinedAt: new Date(),
      });

      // Maintain legacy members array for visual avatar stacking
      if (!project.members.includes(req.user.avatar)) {
        project.members.push(req.user.avatar);
      }

      await project.save();
    }

    // 3. Update Invitation Record
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // 4. Log workspace activity
    workspace.activities.unshift({
      user: req.user.name,
      action: 'joined project via invitation',
      target: project.name,
      timestamp: 'Just now',
      createdAt: new Date(),
    });
    await workspace.save();

    res.status(200).json({
      success: true,
      message: `You have successfully joined '${project.name}' as a ${invitation.role}.`,
      data: {
        projectId: project._id,
        projectName: project.name,
        workspaceId: workspace._id,
        workspaceName: workspace.name,
        role: invitation.role,
      },
    });
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
    if (currentUserEmail !== invitation.email.toLowerCase().trim()) {
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
        (c.email && c.email.toLowerCase() === lowerId)
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
