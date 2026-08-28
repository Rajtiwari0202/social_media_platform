import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../lib/redis.js';
import { env } from '../config/env.js';
import { AppError } from './error.middleware.js';

// Helper to determine whether to use Redis or In-Memory store
const createStore = (prefix: string) => {
  if (env.NODE_ENV === 'test') {
    return undefined; // In-memory store for unit & integration testing
  }

  return new RedisStore({
    // @ts-expect-error ioredis sendCommand compatibility
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix,
  });
};

// Rate Limiter for Login (5 requests per 15 minutes)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:login:'),
  handler: (req, res, next) => {
    next(
      new AppError(
        429,
        'Too Many Requests',
        'Too many failed login attempts from this IP. Please try again after 15 minutes.'
      )
    );
  },
});

// Rate Limiter for Registration (3 accounts per hour)
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('rl:register:'),
  handler: (req, res, next) => {
    next(
      new AppError(
        429,
        'Too Many Requests',
        'Too many accounts created from this IP. Please try again later.'
      )
    );
  },
});
