import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';

const startServer = async () => {
  try {
    logger.info('🚀 Initializing Social Media Platform API...');

    // 1. Connect to Redis
    await redis.connect().catch((err) => {
      logger.warn({ err: err.message }, 'Redis initial connection warning (will retry on demand)');
    });

    // 2. Test database connection
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected successfully');

    // 3. Create Express App & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    // 4. Start listening
    server.listen(env.PORT, () => {
      logger.info(`✨ API Server running in [${env.NODE_ENV}] mode on http://localhost:${env.PORT}`);
      logger.info(`🏥 Health check active at http://localhost:${env.PORT}/health`);
      logger.info(`🌐 API V1 endpoint at http://localhost:${env.PORT}/api/v1`);
    });

    // 5. Graceful Shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await prisma.$disconnect();
          logger.info('Prisma disconnected.');
          await redis.quit();
          logger.info('Redis disconnected.');
        } catch (err) {
          logger.error({ err }, 'Error during graceful shutdown');
        } finally {
          process.exit(0);
        }
      });

      // Force exit after 10s if hanging
      setTimeout(() => {
        logger.error('Forceful shutdown after 10s timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ error }, 'Fatal error during server startup');
    process.exit(1);
  }
};

startServer();
