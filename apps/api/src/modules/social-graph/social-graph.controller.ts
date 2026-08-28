import { Request, Response, NextFunction } from 'express';
import { socialGraphService, SocialGraphService } from './social-graph.service.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { FollowersQueryInput } from '@social/shared';

export class SocialGraphController {
  constructor(private readonly service: SocialGraphService = socialGraphService) {}

  private extractUsername(req: Request): string {
    const rawUsername = req.params.username;
    const username = Array.isArray(rawUsername) ? rawUsername[0] : rawUsername;
    if (!username) {
      throw new AppError(400, 'Bad Request', 'Username parameter is required.');
    }
    return username;
  }

  follow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const targetUsername = this.extractUsername(req);

      const result = await this.service.followUser(req.user.userId, targetUsername);

      res.status(200).json({
        status: 'success',
        message: `You are now following @${targetUsername}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  unfollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const targetUsername = this.extractUsername(req);

      const result = await this.service.unfollowUser(req.user.userId, targetUsername);

      res.status(200).json({
        status: 'success',
        message: `You have unfollowed @${targetUsername}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getFollowers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUsername = this.extractUsername(req);
      const query: FollowersQueryInput = {
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        search: req.query.search as string | undefined,
      };

      const viewerId = req.user?.userId;
      const result = await this.service.getFollowers(targetUsername, query, viewerId);

      res.status(200).json({
        status: 'success',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getFollowing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUsername = this.extractUsername(req);
      const query: FollowersQueryInput = {
        cursor: req.query.cursor as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        search: req.query.search as string | undefined,
      };

      const viewerId = req.user?.userId;
      const result = await this.service.getFollowing(targetUsername, query, viewerId);

      res.status(200).json({
        status: 'success',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  block = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const targetUsername = this.extractUsername(req);

      await this.service.blockUser(req.user.userId, targetUsername);

      res.status(200).json({
        status: 'success',
        message: `User @${targetUsername} has been blocked.`,
      });
    } catch (error) {
      next(error);
    }
  };

  unblock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const targetUsername = this.extractUsername(req);

      await this.service.unblockUser(req.user.userId, targetUsername);

      res.status(200).json({
        status: 'success',
        message: `User @${targetUsername} has been unblocked.`,
      });
    } catch (error) {
      next(error);
    }
  };

  mute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const targetUsername = this.extractUsername(req);

      await this.service.muteUser(req.user.userId, targetUsername);

      res.status(200).json({
        status: 'success',
        message: `User @${targetUsername} has been muted.`,
      });
    } catch (error) {
      next(error);
    }
  };

  unmute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
      const targetUsername = this.extractUsername(req);

      await this.service.unmuteUser(req.user.userId, targetUsername);

      res.status(200).json({
        status: 'success',
        message: `User @${targetUsername} has been unmuted.`,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const socialGraphController = new SocialGraphController();
