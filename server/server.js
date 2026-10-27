import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { validateEnv, ENV } from './config/env.js';

const PORT = ENV.PORT;

async function bootstrap() {
  try {
    // 1. Validate environment configuration & production security settings
    validateEnv();

    // 2. Connect to MongoDB
    await connectDB();

    // 3. Start Express Server
    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`PulsePlan SaaS API Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`Workspaces:  http://localhost:${PORT}/api/workspaces`);
      console.log(`====================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[Server Error]: Port ${PORT} is already in use.`);
        console.error(`Another process is already listening on port ${PORT}.`);
        console.error(`To release port ${PORT} on Windows PowerShell, run:`);
        console.error(`  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
      } else {
        console.error('[Server Error]:', err.message);
      }
      process.exit(1);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] Process terminated.');
        process.exit(0);
      });
      setTimeout(() => {
        process.exit(0);
      }, 2000).unref();
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[Server Startup Failure]:', error.message);
    process.exit(1);
  }
}

bootstrap();
