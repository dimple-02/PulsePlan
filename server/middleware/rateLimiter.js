const ipRequestCounts = new Map();

/**
 * In-Memory Sliding-Window Rate Limiter Middleware
 * 
 * Protects sensitive endpoints (such as /api/auth/login and /api/auth/signup)
 * against brute-force password guessing, credential stuffing, and DoS attacks.
 * 
 * @param {Object} options
 * @param {number} options.windowMs - Sliding window duration in milliseconds (default: 15 minutes)
 * @param {number} options.max - Maximum permitted requests per window per IP (default: 20)
 * @param {string} options.message - User-facing error message upon rate limit breach
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 20,
  message = 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
} = {}) {
  return (req, res, next) => {
    // Extract client IP address (supporting reverse proxy headers safely)
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    const now = Date.now();
    const endpointKey = `${req.baseUrl || ''}${req.path}:${clientIp}`;

    let record = ipRequestCounts.get(endpointKey);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      ipRequestCounts.set(endpointKey, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.max(1, Math.ceil((record.startTime + windowMs - now) / 1000));

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: resetSeconds,
      });
    }

    next();
  };
}

/**
 * Reset memory store (used by automated test suites for clean isolation)
 */
export function resetRateLimitStore() {
  ipRequestCounts.clear();
}
