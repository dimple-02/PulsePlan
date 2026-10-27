import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import {
  getWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
} from '../controllers/workspaceController.js';

const router = express.Router();

/**
 * Workspace Routes: /api/workspaces
 */

router.get('/', requireAuth, getWorkspaces);

router.post(
  '/:id/members',
  requireAuth,
  [
    param('id').isMongoId().withMessage('Invalid workspace ID format'),
    body('name').trim().notEmpty().withMessage('Member name is required'),
    body('email').isEmail().withMessage('A valid email address is required'),
    body('role').optional().isIn(['Owner', 'Admin', 'Member']).withMessage('Invalid role'),
    validate,
  ],
  addWorkspaceMember
);


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
