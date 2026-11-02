import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV, isAllowedOrigin } from './config/env.js';
import { csrfProtection } from './middleware/csrf.js';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Disable x-powered-by header to prevent fingerprinting
app.disable('x-powered-by');

// Express reverse proxy trust setting for Render / Vercel
if (ENV.IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

// HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (ENV.IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

/**
 * CORS Configuration
 * Allows only explicitly whitelisted origins with credentials (no wildcard or blind reflection)
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests with no origin (e.g. curl, server-to-server)
      if (!origin) return callback(null, true);

      // Verify origin against configured whitelist
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin '${origin}' not allowed by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id', 'x-tenant-id'],
  })
);

// Cookie Parser Middleware
app.use(cookieParser());

// Anti-CSRF Middleware for state-changing cookie requests
app.use(csrfProtection);

// Body Parser Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/**
 * Healthcheck Route
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'PulsePlan SaaS API',
  });
});

/**
 * API Resource Routing
 */
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/invitations', invitationRoutes);

/**
 * 404 Route Not Found Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
  });
});

/**
 * Centralized Error-Handling Middleware
 */
app.use(errorHandler);

export default app;
