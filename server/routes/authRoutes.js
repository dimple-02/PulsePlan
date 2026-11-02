import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import {
  signup,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
} from '../controllers/authController.js';
import {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from '../controllers/passwordResetController.js';
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
 * Rate Limiter for OTP Generation & Reset Requests
 * Prevents email flooding, SMS/SMTP abuse, and brute-force token generation.
 */
const otpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many verification requests. Please try again after 15 minutes.',
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
  authRateLimiter,
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
 * POST /api/auth/verify-email
 * Validates 6-digit email OTP during signup
 */
router.post(
  '/verify-email',
  otpRateLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
    body('otp')
      .trim()
      .notEmpty()
      .withMessage('6-digit verification code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be exactly 6 digits'),
    validate,
  ],
  verifyEmail
);

/**
 * POST /api/auth/resend-verification
 * Resends 6-digit email OTP with 60-second cooldown
 */
router.post(
  '/resend-verification',
  otpRateLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail(),
    validate,
  ],
  resendVerification
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

/**
 * POST /api/auth/forgot-password
 * Initiates the 6-digit OTP email verification flow
 */
router.post(
  '/forgot-password',
  otpRateLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    validate,
  ],
  forgotPassword
);

/**
 * POST /api/auth/verify-reset-otp
 * Verifies the 6-digit OTP code entered by the user
 */
router.post(
  '/verify-reset-otp',
  otpRateLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('otp')
      .trim()
      .notEmpty()
      .withMessage('6-digit verification code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be exactly 6 digits'),
    validate,
  ],
  verifyResetOtp
);

/**
 * POST /api/auth/reset-password
 * Updates the user's password securely and invalidates active sessions
 */
router.post(
  '/reset-password',
  otpRateLimiter,
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
    validate,
  ],
  resetPassword
);

export default router;
