import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { csrfProtection } from './middleware/csrf.js';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

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
      if (ENV.ALLOWED_ORIGINS.includes(origin)) {
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
app.use(express.urlencoded({ extended: true }));

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
