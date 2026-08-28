import { Router } from 'express';
import { usersController } from './users.controller.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { UpdateProfileSchema } from '@social/shared';

export const usersRouter = Router();

usersRouter.get('/:username', optionalAuthenticate, usersController.getProfile);

usersRouter.patch(
  '/profile',
  authenticate,
  validateRequest({ body: UpdateProfileSchema }),
  usersController.updateProfile
);
