import { Request, Response, NextFunction } from 'express';
import { postsService, PostsService } from './posts.service.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { CreatePostInput, PostFeedQueryInput, CreateCommentInput } from '@social/shared';

export class PostsController {
  constructor(private readonly service: PostsService = postsService) {}

  private extractPostId(req: Request): string {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) throw new AppError(400, 'Bad Request', 'Post ID parameter is required.');
    return id;
  }

  createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const input: CreatePostInput = req.body;

      const post = await this.service.createPost(req.user.userId, input);

      res.status(201).json({
        status: 'success',
        data: post,
      });
    } catch (error) {
      next(error);
    }
  };

  getPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postId = this.extractPostId(req);
      const viewerId = req.user?.userId;

      const post = await this.service.getPostById(postId, viewerId);

      res.status(200).json({
        status: 'success',
        data: post,
      });
    } catch (error) {
      next(error);
    }
  };

  getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: PostFeedQueryInput = {
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        authorUsername: req.query.authorUsername as string | undefined,
        tag: req.query.tag as string | undefined,
      };

      const viewerId = req.user?.userId;
      const result = await this.service.getFeed(query, viewerId);

      res.status(200).json({
        status: 'success',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const postId = this.extractPostId(req);

      await this.service.deletePost(postId, req.user.userId, req.user.role);

      res.status(200).json({
        status: 'success',
        message: 'Post deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  likePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const postId = this.extractPostId(req);

      const result = await this.service.toggleLike(req.user.userId, postId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  bookmarkPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const postId = this.extractPostId(req);

      const result = await this.service.toggleBookmark(req.user.userId, postId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  repostPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const postId = this.extractPostId(req);

      const result = await this.service.toggleRepost(req.user.userId, postId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const postId = this.extractPostId(req);
      const input: CreateCommentInput = req.body;

      const comment = await this.service.createComment(postId, req.user.userId, input);

      res.status(201).json({
        status: 'success',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  };

  getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postId = this.extractPostId(req);
      const viewerId = req.user?.userId;

      const comments = await this.service.getPostComments(postId, viewerId);

      res.status(200).json({
        status: 'success',
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const postsController = new PostsController();
