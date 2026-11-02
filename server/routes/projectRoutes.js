import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope, requireTenant } from '../middleware/tenantScope.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import {
  createProjectInvitation,
  getProjectInvitations,
  resendInvitation,
  revokeInvitation,
  getProjectCollaborators,
  removeProjectCollaborator,
} from '../controllers/invitationController.js';

const router = express.Router();

// Enforce user authentication and workspace tenant scoping on all project routes
router.use(requireAuth);
router.use(tenantScope);
router.use(requireTenant);

/**
 * Project Routes: /api/projects
 * Header required: 'x-workspace-id' or query '?workspaceId='
 */

router.get('/', getProjects);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid project ID format'), validate],
  getProjectById
);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 120 }).withMessage('Name too long'),
    body('key').optional().trim().isLength({ max: 10 }).withMessage('Key cannot exceed 10 characters'),
    body('status').optional().isIn(['Planning', 'In Progress', 'Under Review', 'Completed']).withMessage('Invalid project status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid project priority'),
    body('category').optional().isIn([
      'Product',
      'DevOps',
      'Security',
      'Data Platform',
      'Payments',
      'Compliance',
      'Mobile Design',
      'Branding',
      'General',
    ]).withMessage('Invalid project category'),
    validate,
  ],
  createProject
);

router.patch(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid project ID format'),
    body('status').optional().isIn(['Planning', 'In Progress', 'Under Review', 'Completed']).withMessage('Invalid project status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid project priority'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
    validate,
  ],
  updateProject
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid project ID format'), validate],
  deleteProject
);

/**
 * Project Collaborators & Invitations Routes
 * Scoped to active tenant workspace
 */
router.get(
  '/:projectId/collaborators',
  [param('projectId').isMongoId().withMessage('Invalid project ID'), validate],
  getProjectCollaborators
);

router.delete(
  '/:projectId/collaborators/:userIdOrEmail',
  [param('projectId').isMongoId().withMessage('Invalid project ID'), validate],
  removeProjectCollaborator
);

router.get(
  '/:projectId/invitations',
  [param('projectId').isMongoId().withMessage('Invalid project ID'), validate],
  getProjectInvitations
);

router.post(
  '/:projectId/invitations',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Collaborator email is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(['Admin', 'Member', 'Viewer'])
      .withMessage('Role must be Admin, Member, or Viewer'),
    validate,
  ],
  createProjectInvitation
);

router.post(
  '/:projectId/invitations/:invitationId/resend',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('invitationId').isMongoId().withMessage('Invalid invitation ID'),
    validate,
  ],
  resendInvitation
);

router.post(
  '/:projectId/invitations/:invitationId/revoke',
  [
    param('projectId').isMongoId().withMessage('Invalid project ID'),
    param('invitationId').isMongoId().withMessage('Invalid invitation ID'),
    validate,
  ],
  revokeInvitation
);

export default router;
