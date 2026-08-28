import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { loginRateLimiter, registerRateLimiter } from '../../middlewares/rate-limit.middleware.js';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '@social/shared';

export const authRouter = Router();

authRouter.post(
  '/register',
  registerRateLimiter,
  validateRequest({ body: RegisterSchema }),
  authController.register
);

authRouter.post(
  '/login',
  loginRateLimiter,
  validateRequest({ body: LoginSchema }),
  authController.login
);

authRouter.post(
  '/refresh',
  validateRequest({ body: RefreshTokenSchema }),
  authController.refresh
);

authRouter.post('/logout', authController.logout);

authRouter.post('/logout-all', authenticate, authController.logoutAll);

authRouter.get('/me', authenticate, authController.me);
