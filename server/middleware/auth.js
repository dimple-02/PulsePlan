import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { getCookieOptions } from '../controllers/authController.js';

/**
 * Authentication Middleware
 * 
 * Verifies HTTP-only session cookie or Bearer token header.
 * Enforces:
 * - HMAC-SHA256 (HS256) signature verification
 * - Expiration and required claims verification
 * - Server-side session invalidation via tokenVersion check
 * - Attaches sanitized user document to req.user
 */
export async function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Check HTTP-only session cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback to Authorization: Bearer <token> header for API clients
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this resource.',
      });
    }

    // Verify token with explicit algorithm check
    const decoded = jwt.verify(token, ENV.JWT_SECRET, { algorithms: ['HS256'] });

    // Validate required claims
    if (!decoded || !decoded.id) {
      res.clearCookie('token', getCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'Invalid session token claims.',
      });
    }

    // Fetch user from DB
    const user = await User.findById(decoded.id);
    if (!user) {
      res.clearCookie('token', getCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'The user account associated with this session no longer exists.',
      });
    }

    // Genuine Server-Side Session Invalidation (Requirement 2)
    // If the user has logged out or invalidated sessions, tokenVersion will not match
    const userTokenVersion = user.tokenVersion || 0;
    if (decoded.tokenVersion === undefined || decoded.tokenVersion !== userTokenVersion) {
      res.clearCookie('token', getCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      res.clearCookie('token', getCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'Session has expired or is invalid. Please log in again.',
      });
    }
    next(error);
  }
}

/**
 * Optional Authentication Middleware
 * Populates req.user if a valid, un-revoked token is present, but doesn't block unauthenticated requests.
 */
export async function optionalAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id);
        const userTokenVersion = user?.tokenVersion || 0;
        if (user && decoded.tokenVersion === userTokenVersion) {
          req.user = user;
        }
      }
    }
    next();
  } catch {
    next();
  }
}
