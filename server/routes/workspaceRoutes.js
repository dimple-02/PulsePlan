import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import {
  getWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
} from '../controllers/workspaceController.js';
import {
  createWorkspaceInvitation,
  getWorkspaceInvitations,
  resendInvitation,
  revokeInvitation,
} from '../controllers/invitationController.js';
import { getMessages, sendMessage } from '../controllers/messageController.js';
import { NORMALIZE_EMAIL_OPTS } from '../utils/emailUtils.js';

const router = express.Router();

/**
 * Workspace Routes: /api/workspaces
 */

// 1. Workspace Collection
router.get('/', requireAuth, getWorkspaces);

// 2. Member Management
router.post(
  '/:id/members',
  requireAuth,
  [
    param('id').isMongoId().withMessage('Invalid workspace ID format'),
    body('name').trim().notEmpty().withMessage('Member name is required'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('A valid email address is required')
      .isEmail()
      .withMessage('A valid email address is required')
      .normalizeEmail(NORMALIZE_EMAIL_OPTS),
    body('role').optional().isIn(['Owner', 'Admin', 'Member']).withMessage('Invalid role'),
    validate,
  ],
  addWorkspaceMember
);

router.delete(
  '/:id/members/:memberId',
  requireAuth,
  [
    param('id').isMongoId().withMessage('Invalid workspace ID format'),
    param('memberId').trim().notEmpty().withMessage('Member identifier is required'),
    validate,
  ],
  removeWorkspaceMember
);

// 2b. Workspace Email Invitations
router.get(
  ['/:workspaceId/invitations', '/:id/invitations'],
  requireAuth,
  (req, res, next) => {
    if (!req.params.workspaceId && req.params.id) req.params.workspaceId = req.params.id;
    next();
  },
  tenantScope,
  [
    param('workspaceId').optional().isMongoId().withMessage('Invalid workspace ID format'),
    param('id').optional().isMongoId().withMessage('Invalid workspace ID format'),
    validate,
  ],
  getWorkspaceInvitations
);

router.post(
  ['/:workspaceId/invitations', '/:id/invitations'],
  requireAuth,
  (req, res, next) => {
    if (!req.params.workspaceId && req.params.id) req.params.workspaceId = req.params.id;
    next();
  },
  tenantScope,
  [
    param('workspaceId').optional().isMongoId().withMessage('Invalid workspace ID format'),
    param('id').optional().isMongoId().withMessage('Invalid workspace ID format'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Member email is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(NORMALIZE_EMAIL_OPTS),
    body('role').optional().isIn(['Owner', 'Admin', 'Member']).withMessage('Invalid role'),
    validate,
  ],
  createWorkspaceInvitation
);

router.post(
  ['/:workspaceId/invitations/:invitationId/resend', '/:id/invitations/:invitationId/resend'],
  requireAuth,
  (req, res, next) => {
    if (!req.params.workspaceId && req.params.id) req.params.workspaceId = req.params.id;
    next();
  },
  tenantScope,
  [
    param('workspaceId').optional().isMongoId().withMessage('Invalid workspace ID format'),
    param('id').optional().isMongoId().withMessage('Invalid workspace ID format'),
    param('invitationId').isMongoId().withMessage('Invalid invitation ID format'),
    validate,
  ],
  resendInvitation
);

router.post(
  ['/:workspaceId/invitations/:invitationId/revoke', '/:id/invitations/:invitationId/revoke'],
  requireAuth,
  (req, res, next) => {
    if (!req.params.workspaceId && req.params.id) req.params.workspaceId = req.params.id;
    next();
  },
  tenantScope,
  [
    param('workspaceId').optional().isMongoId().withMessage('Invalid workspace ID format'),
    param('id').optional().isMongoId().withMessage('Invalid workspace ID format'),
    param('invitationId').isMongoId().withMessage('Invalid invitation ID format'),
    validate,
  ],
  revokeInvitation
);

// 3. Workspace Messages & Team/Direct Chat
router.get(
  '/:id/messages',
  requireAuth,
  [param('id').isMongoId().withMessage('Invalid workspace ID format'), validate],
  getMessages
);

router.post(
  '/:id/messages',
  requireAuth,
  [
    param('id').isMongoId().withMessage('Invalid workspace ID format'),
    body('content').trim().notEmpty().withMessage('Message content cannot be empty'),
    validate,
  ],
  sendMessage
);

// 4. Single Workspace Operations
router.get(
  '/:id',
  requireAuth,
  [param('id').isMongoId().withMessage('Invalid workspace ID format'), validate],
  getWorkspaceById
);

router.post(
  '/',
  requireAuth,
  [
    body('name').trim().notEmpty().withMessage('Workspace name is required').isLength({ max: 100 }).withMessage('Name too long'),
    body('plan').optional().isIn(['Starter', 'Pro Team', 'Enterprise']).withMessage('Invalid plan tier'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description exceeds 500 characters'),
    validate,
  ],
  createWorkspace
);

router.patch(
  '/:id',
  requireAuth,
  [
    param('id').isMongoId().withMessage('Invalid workspace ID format'),
    body('plan').optional().isIn(['Starter', 'Pro Team', 'Enterprise']).withMessage('Invalid plan tier'),
    validate,
  ],
  updateWorkspace
);

router.delete(
  '/:id',
  requireAuth,
  [param('id').isMongoId().withMessage('Invalid workspace ID format'), validate],
  deleteWorkspace
);

export default router;
