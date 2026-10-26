import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import {
import {
  signup,
  login,
  logout,
  getMe,
} from '../controllers/authController.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Rate Limiter for Authentication Endpoints
 * Limits rapid password guessing and brute force credential attacks.
 */
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15-minute sliding window
  max: 20, // 20 requests per window
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

/**
 * POST /api/auth/signup
 */
router.post(
  '/signup',
  authRateLimiter,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 80 })
      .withMessage('Name cannot exceed 80 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    validate,
  ],
  signup
);

/**
 * POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate,
  ],
  login
);

/**
 * POST /api/auth/logout
 */
router.post('/logout', optionalAuth, logout);

/**
 * GET /api/auth/me
 * Protected by requireAuth middleware
 */
router.get('/me', requireAuth, getMe);

export default router;
