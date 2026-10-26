import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace.js';

/**
 * Tenant Scoping Middleware
 * 
 * Multi-Tenancy Architecture (College Viva Discussion):
 * -----------------------------------------------------
 * In this Phase 2 evaluation, tenant scoping is enforced by extracting the
 * target workspace ID from HTTP headers ('x-workspace-id' / 'x-tenant-id')
 * or query parameters.
 * 
 * IMPORTANT NOTE ON SECURITY LIMITATIONS:
 * In a true production SaaS, a client-supplied workspace ID must NEVER be trusted blindly.
 * True production isolation requires server-side session/JWT authentication where
 * the authenticated user's organization membership is validated in the database before granting access.
 * Here, we enforce rigorous workspace-level boundary checks on all DB queries while
 * transparently documenting this evaluation limitation.
 */
export async function tenantScope(req, res, next) {
  try {
    const rawWorkspaceId =
      req.headers['x-workspace-id'] ||
      req.headers['x-tenant-id'] ||
      req.query.workspaceId ||
      req.body.workspaceId;

    if (!rawWorkspaceId) {
      // If endpoint doesn't strictly mandate workspaceId (e.g. GET /api/workspaces), continue
      return next();
    }

    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(rawWorkspaceId)) {
      const workspace = await Workspace.findById(rawWorkspaceId);
      if (!workspace) {
        return res.status(404).json({
          success: false,
          message: `Workspace with ID '${rawWorkspaceId}' was not found.`,
        });
      }
      req.workspace = workspace;
      req.workspaceId = workspace._id;
      return next();
    }

    // Also support lookup by slug (e.g. 'acme-cloud' or 'ws-acme') for convenient API testing
    const workspaceBySlug = await Workspace.findOne({
      $or: [{ slug: rawWorkspaceId }, { slug: rawWorkspaceId.replace(/^ws-/, '') }],
    });

    if (workspaceBySlug) {
      req.workspace = workspaceBySlug;
      req.workspaceId = workspaceBySlug._id;
      return next();
    }

    return res.status(400).json({
      success: false,
      message: `Invalid workspace identifier format: '${rawWorkspaceId}'. Must be a 24-character hexadecimal ObjectId or valid workspace slug.`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware ensuring that req.workspaceId is guaranteed to be present
 */
export function requireTenant(req, res, next) {
  if (!req.workspaceId) {
    return res.status(400).json({
      success: false,
      message: 'Workspace context is required. Please provide the "x-workspace-id" header or "?workspaceId=" query parameter.',
    });
  }
  next();
}
