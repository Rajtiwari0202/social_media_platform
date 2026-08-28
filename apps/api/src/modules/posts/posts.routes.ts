import { Router } from 'express';
import { postsController } from './posts.controller.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { CreatePostSchema, PostFeedQuerySchema, PostIdParamSchema, CreateCommentSchema } from '@social/shared';

export const postsRouter = Router();

// Post CRUD
postsRouter.post(
  '/',
  authenticate,
  validateRequest({ body: CreatePostSchema }),
  postsController.createPost
);

postsRouter.get(
  '/',
  optionalAuthenticate,
  validateRequest({ query: PostFeedQuerySchema }),
  postsController.getFeed
);

postsRouter.get(
  '/:id',
  optionalAuthenticate,
  validateRequest({ params: PostIdParamSchema }),
  postsController.getPost
);

postsRouter.delete(
  '/:id',
  authenticate,
  validateRequest({ params: PostIdParamSchema }),
  postsController.deletePost
);

// Interactions (Likes, Bookmarks, Reposts)
postsRouter.post(
  '/:id/like',
  authenticate,
  validateRequest({ params: PostIdParamSchema }),
  postsController.likePost
);

postsRouter.post(
  '/:id/bookmark',
  authenticate,
  validateRequest({ params: PostIdParamSchema }),
  postsController.bookmarkPost
);

postsRouter.post(
  '/:id/repost',
  authenticate,
  validateRequest({ params: PostIdParamSchema }),
  postsController.repostPost
);

// Threaded Comments
postsRouter.post(
  '/:id/comments',
  authenticate,
  validateRequest({ params: PostIdParamSchema, body: CreateCommentSchema }),
  postsController.createComment
);

postsRouter.get(
  '/:id/comments',
  optionalAuthenticate,
  validateRequest({ params: PostIdParamSchema }),
  postsController.getComments
);
