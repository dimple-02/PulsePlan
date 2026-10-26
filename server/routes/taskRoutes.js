import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { tenantScope, requireTenant } from '../middleware/tenantScope.js';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';

const router = express.Router();

// Enforce workspace tenant scoping on all task routes
router.use(tenantScope);
router.use(requireTenant);

/**
 * Task Routes: /api/tasks
 * Header required: 'x-workspace-id' or query '?workspaceId='
 */

router.get('/', getTasks);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid task ID format'), validate],
  getTaskById
);

router.post(
  '/',
  [
    body('projectId').isMongoId().withMessage('Valid projectId is required'),
    body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 200 }).withMessage('Title too long'),
    body('status').optional().isIn(['backlog', 'todo', 'in_progress', 'review', 'done']).withMessage('Invalid task status'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid task priority'),
    body('storyPoints').optional().isInt({ min: 0 }).withMessage('Story points must be non-negative integer'),
    validate,
  ],
  createTask
);

router.patch(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid task ID format'),
    body('projectId').optional().isMongoId().withMessage('Valid projectId is required'),
    body('status').optional().isIn(['backlog', 'todo', 'in_progress', 'review', 'done']).withMessage('Invalid task status'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid task priority'),
    body('storyPoints').optional().isInt({ min: 0 }).withMessage('Story points must be non-negative integer'),
    validate,
  ],
  updateTask
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid task ID format'), validate],
  deleteTask
);

export default router;
