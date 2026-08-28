import { Router } from 'express';
import { socialGraphController } from './social-graph.controller.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { FollowersQuerySchema, UsernameParamSchema } from '@social/shared';

export const socialGraphRouter = Router();

// Follow / Unfollow
socialGraphRouter.post(
  '/:username/follow',
  authenticate,
  validateRequest({ params: UsernameParamSchema }),
  socialGraphController.follow
);

socialGraphRouter.delete(
  '/:username/follow',
  authenticate,
  validateRequest({ params: UsernameParamSchema }),
  socialGraphController.unfollow
);

// Follower / Following Lists
socialGraphRouter.get(
  '/:username/followers',
  optionalAuthenticate,
  validateRequest({ params: UsernameParamSchema, query: FollowersQuerySchema }),
  socialGraphController.getFollowers
);

socialGraphRouter.get(
  '/:username/following',
  optionalAuthenticate,
  validateRequest({ params: UsernameParamSchema, query: FollowersQuerySchema }),
  socialGraphController.getFollowing
);

// Block / Unblock
socialGraphRouter.post(
  '/:username/block',
  authenticate,
  validateRequest({ params: UsernameParamSchema }),
  socialGraphController.block
);

socialGraphRouter.delete(
  '/:username/block',
  authenticate,
  validateRequest({ params: UsernameParamSchema }),
  socialGraphController.unblock
);

// Mute / Unmute
socialGraphRouter.post(
  '/:username/mute',
  authenticate,
  validateRequest({ params: UsernameParamSchema }),
  socialGraphController.mute
);

socialGraphRouter.delete(
  '/:username/mute',
  authenticate,
  validateRequest({ params: UsernameParamSchema }),
  socialGraphController.unmute
);
