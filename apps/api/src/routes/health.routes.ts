import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '0.1.0',
  });
});

healthRouter.get('/ready', async (req: Request, res: Response) => {
  const checks: Record<string, string> = {
    database: 'down',
    redis: 'down',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'up';
  } catch (err) {
    checks.database = 'error';
  }

  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'up' : 'error';
  } catch (err) {
    checks.redis = 'error';
  }

  const isReady = Object.values(checks).every((status) => status === 'up');

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});
