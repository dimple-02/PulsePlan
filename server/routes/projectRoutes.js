import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { tenantScope, requireTenant } from '../middleware/tenantScope.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';

const router = express.Router();

// Enforce workspace tenant scoping on all project routes
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

export default router;
