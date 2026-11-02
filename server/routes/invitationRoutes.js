import express from 'express';
import { param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import {
  getInvitationByToken,
  acceptInvitation,
  rejectInvitation,
  resendInvitation,
  revokeInvitation,
} from '../controllers/invitationController.js';

const router = express.Router();

/**
 * Public Invitation Query Route
 * GET /api/invitations/token/:token
 * Used by the Accept / Reject invitation page to view project details
 */
router.get(
  '/token/:token',
  [
    param('token')
      .trim()
      .notEmpty()
      .withMessage('Invitation token is required')
      .isHexadecimal()
      .withMessage('Invalid token format'),
    validate,
  ],
  getInvitationByToken
);

/**
 * Protected Invitation Action Routes
 * POST /api/invitations/token/:token/accept
 * POST /api/invitations/token/:token/reject
 * Enforces authenticated session & recipient email match
 */
router.post(
  '/token/:token/accept',
  requireAuth,
  [
    param('token')
      .trim()
      .notEmpty()
      .withMessage('Invitation token is required')
      .isHexadecimal()
      .withMessage('Invalid token format'),
    validate,
  ],
  acceptInvitation
);

router.post(
  '/token/:token/reject',
  requireAuth,
  [
    param('token')
      .trim()
      .notEmpty()
      .withMessage('Invitation token is required')
      .isHexadecimal()
      .withMessage('Invalid token format'),
    validate,
  ],
  rejectInvitation
);

/**
 * Management Routes by Invitation ID (Scoped)
 */
router.post(
  '/:id/resend',
  requireAuth,
  tenantScope,
  [param('id').isMongoId().withMessage('Invalid invitation ID'), validate],
  resendInvitation
);

router.post(
  '/:id/revoke',
  requireAuth,
  tenantScope,
  [param('id').isMongoId().withMessage('Invalid invitation ID'), validate],
  revokeInvitation
);

router.delete(
  '/:id',
  requireAuth,
  tenantScope,
  [param('id').isMongoId().withMessage('Invalid invitation ID'), validate],
  revokeInvitation
);

export default router;
