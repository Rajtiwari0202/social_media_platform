import { Router } from 'express';
import { usersController } from './users.controller.js';
import { socialGraphRouter } from '../social-graph/social-graph.routes.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { UpdateProfileSchema, UsernameParamSchema } from '@social/shared';

export const usersRouter = Router();

// Profile update route MUST be registered before /:username dynamic route
usersRouter.patch(
  '/profile',
  authenticate,
  validateRequest({ body: UpdateProfileSchema }),
  usersController.updateProfile
);

// Mount social graph subroutes (follow, unfollow, followers, following, block, mute)
usersRouter.use('/', socialGraphRouter);

// Public profile retrieval
usersRouter.get(
  '/:username',
  optionalAuthenticate,
  validateRequest({ params: UsernameParamSchema }),
  usersController.getProfile
);
