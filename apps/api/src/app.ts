import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { postsRouter } from './modules/posts/posts.routes.js';
import { mediaRouter } from './modules/media/media.routes.js';
import { errorHandler, AppError } from './middlewares/error.middleware.js';

export const createApp = (): Express => {
  const app = express();

  // 1. Security Headers & CORS
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 2. Parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // 3. Health check route (unversioned for k8s/load balancers)
  app.use('/health', healthRouter);

  // 4. API v1 Router Root
  const apiV1Router = express.Router();

  apiV1Router.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Social Media Platform API',
      version: 'v1.0.0',
      status: 'operational',
      endpoints: {
        health: '/health',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        posts: '/api/v1/posts',
        media: '/api/v1/media',
      },
    });
  });

  // Mount Feature Modules
  apiV1Router.use('/auth', authRouter);
  apiV1Router.use('/users', usersRouter);
  apiV1Router.use('/posts', postsRouter);
  apiV1Router.use('/media', mediaRouter);

  app.use('/api/v1', apiV1Router);

  // 5. 404 Not Found Handler
  app.use((req: Request, res: Response, next) => {
    next(new AppError(404, 'Route Not Found', `Cannot ${req.method} ${req.originalUrl}`));
  });

  // 6. Global RFC 7807 Error Handler
  app.use(errorHandler);

  return app;
};
