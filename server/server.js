import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start Express Server
    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`PulsePlan SaaS API Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Healthcheck: http://localhost:${PORT}/api/health`);
      console.log(`Workspaces:  http://localhost:${PORT}/api/workspaces`);
      console.log(`====================================================`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[Server Startup Failure]:', error.message);
    process.exit(1);
  }
}

bootstrap();
