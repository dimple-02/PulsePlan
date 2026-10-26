import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';

/**
 * Tenant Scoping & Server-Side Membership Authorization Middleware
 * 
 * Multi-Tenant Security Rules (Requirements 9 & 10):
 * --------------------------------------------------
 * 1. The 'x-workspace-id' header or query parameter is NEVER trusted as proof of authorization.
 * 2. Every request accessing a workspace MUST be authenticated (req.user).
 * 3. The server validates that the authenticated user is an explicitly authorized
 *    member or owner of the target workspace before granting access to ANY projects, tasks, or settings.
 * 4. A new user CANNOT access existing workspaces (such as Acme, Nexus, or Studio Zero)
 *    unless an existing admin has explicitly added their email/userId to that workspace's members list.
 */
export async function tenantScope(req, res, next) {
  try {
    const rawWorkspaceId =
      req.headers['x-workspace-id'] ||
      req.headers['x-tenant-id'] ||
      req.query.workspaceId ||
      req.body.workspaceId;

    if (!rawWorkspaceId) {
      return next();
    }

    let workspace = null;

    // 1. Resolve workspace by ObjectId or Slug
    if (mongoose.Types.ObjectId.isValid(rawWorkspaceId)) {
      workspace = await Workspace.findById(rawWorkspaceId);
    } else {
      workspace = await Workspace.findOne({
        $or: [{ slug: rawWorkspaceId }, { slug: rawWorkspaceId.replace(/^ws-/, '') }],
      });
    }

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: `Workspace '${rawWorkspaceId}' was not found.`,
      });
    }

    // 2. Strict Server-Side Membership Authorization
    // Every request accessing workspace data MUST have an authenticated user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access workspace resources.',
      });
    }

    const isMemberInUserList = req.user.workspaces?.some(
      (w) => w.workspaceId.toString() === workspace._id.toString()
    );

    const memberInWorkspace = workspace.members?.find(
      (m) =>
        (m.userId && m.userId.toString() === req.user._id.toString()) ||
        (m.email && m.email.toLowerCase() === req.user.email.toLowerCase())
    );

    if (!isMemberInUserList && !memberInWorkspace) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You are not an authorized member of workspace '${workspace.name}'. The 'x-workspace-id' header is not proof of authorization.`,
      });
    }

    // Synchronize membership link if email matched in workspace members
    if (memberInWorkspace && !isMemberInUserList) {
      req.user.workspaces.push({
        workspaceId: workspace._id,
        role: memberInWorkspace.role || 'Member',
      });
      await req.user.save();
    }

    req.workspaceRole = memberInWorkspace?.role || 'Member';

    req.workspace = workspace;
    req.workspaceId = workspace._id;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware ensuring that req.workspaceId is guaranteed to be present and authorized
 */
export function requireTenant(req, res, next) {
  if (!req.workspaceId) {
    return res.status(400).json({
      success: false,
      message: 'Workspace context is required. Please provide a valid "x-workspace-id" header or "?workspaceId=" query parameter.',
    });
  }
  next();
}
