import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    logger.warn({ attempt: times, nextRetryInMs: delay }, 'Redis connection retry...');
    return delay;
  },
  reconnectOnError(err) {
    logger.error({ err }, 'Redis reconnect on error trigger');
    return true;
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('✅ Connected to Redis cache & message broker');
});

redis.on('error', (err) => {
  logger.error({ err }, '❌ Redis error occurred');
});
