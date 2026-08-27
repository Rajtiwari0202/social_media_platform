import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import { logger } from './logger.js';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : ['error'],
  });

if (env.NODE_ENV === 'development') {
  globalThis.prismaGlobal = prisma;
  // @ts-expect-error prisma query event typing
  prisma.$on('query', (e: { query: string; duration: number }) => {
    if (e.duration > 100) {
      logger.warn({ query: e.query, durationMs: e.duration }, '⚠️ Slow database query detected');
    }
  });
}
