import { ENV, isAllowedOrigin } from '../config/env.js';

/**
 * CSRF Protection Middleware
 * 
 * Protects cookie-authenticated state-changing requests (POST, PATCH, PUT, DELETE)
 * from Cross-Site Request Forgery (CSRF).
 * 
 * Defense Layers:
 * 1. Checks 'Origin': Validates that requests initiated by the browser originate from
 *    authorized client origins (browsers forbid JavaScript from spoofing Origin).
 * 2. Checks 'Sec-Fetch-Site': Blocks cross-site requests that lack an authorized origin.
 * 3. Checks 'Referer': Fallback origin validation if Origin header is omitted.
 * 4. Exempts Bearer-token-authenticated API requests (as custom headers cannot be forged via standard cross-site HTML forms).
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
    const origin = req.headers.origin;
    const secFetchSite = req.headers['sec-fetch-site'];

    // 1. If an Origin header is present, verify against allowed origins.
    // The browser strictly controls the Origin header; scripts on malicious sites cannot spoof it.
    if (origin) {
      if (!isAllowedOrigin(origin)) {
        return res.status(403).json({
          success: false,
          message: `Cross-Site Request Forgery (CSRF) blocked: Origin '${origin}' is not authorized.`,
        });
      }
      return next();
    }

    // 2. If no Origin header is present, check Sec-Fetch-Site.
    // Blocks requests initiated from cross-site contexts without an authorized origin.
    if (secFetchSite === 'cross-site') {
      return res.status(403).json({
        success: false,
        message: 'Cross-Site Request Forgery (CSRF) blocked: Cross-site request rejected.',
      });
    }

    // 3. Fallback: Check Referer header if Origin header was omitted
    if (req.headers.referer) {
      try {
        const refererOrigin = new URL(req.headers.referer).origin;
        if (!isAllowedOrigin(refererOrigin)) {
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
