import { ENV } from '../config/env.js';

/**
 * CSRF Protection Middleware
 * 
 * Protects cookie-authenticated state-changing requests (POST, PATCH, PUT, DELETE)
 * from Cross-Site Request Forgery (CSRF).
 * 
 * Defense Layers:
 * 1. Checks 'Sec-Fetch-Site': Blocks browser requests initiated from 'cross-site' contexts.
 * 2. Checks 'Origin' / 'Referer': Validates that the request origin matches the configured allowed client origins.
 * 3. Exempts Bearer-token-authenticated API requests (as custom headers cannot be forged via standard cross-site HTML forms).
 */
export function csrfProtection(req, res, next) {
  const stateChangingMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];

  // Safe read-only methods (GET, HEAD, OPTIONS) do not alter server state
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // Exempt public signup and login endpoints (no cookie session exists yet)
  if (req.path === '/api/auth/signup' || req.path === '/api/auth/login') {
    return next();
  }

  // If request uses Authorization: Bearer <token> (API client), CSRF is not applicable
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // If the request carries an HTTP-only session cookie, enforce strict origin verification
  if (req.cookies && req.cookies.token) {
    const secFetchSite = req.headers['sec-fetch-site'];
    if (secFetchSite === 'cross-site') {
      return res.status(403).json({
        success: false,
        message: 'Cross-Site Request Forgery (CSRF) blocked: Cross-site request rejected.',
      });
    }

    const origin = req.headers.origin;
    if (origin) {
      if (!ENV.ALLOWED_ORIGINS.includes(origin)) {
        return res.status(403).json({
          success: false,
          message: `Cross-Site Request Forgery (CSRF) blocked: Origin '${origin}' is not authorized.`,
        });
      }
    } else if (req.headers.referer) {
      try {
        const refererOrigin = new URL(req.headers.referer).origin;
        if (!ENV.ALLOWED_ORIGINS.includes(refererOrigin)) {
          return res.status(403).json({
            success: false,
            message: `Cross-Site Request Forgery (CSRF) blocked: Referer '${refererOrigin}' is not authorized.`,
          });
        }
      } catch {
        return res.status(403).json({
          success: false,
          message: 'Cross-Site Request Forgery (CSRF) blocked: Malformed referer header.',
        });
      }
    }
  }

  next();
}
