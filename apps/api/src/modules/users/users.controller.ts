import { Request, Response, NextFunction } from 'express';
import { usersService, UsersService } from './users.service.js';
import { UpdateProfileInput } from '@social/shared';
import { AppError } from '../../middlewares/error.middleware.js';

export class UsersController {
  constructor(private readonly service: UsersService = usersService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawUsername = req.params.username;
      const username = Array.isArray(rawUsername) ? rawUsername[0] : rawUsername;
      if (!username) {
        throw new AppError(400, 'Bad Request', 'Username parameter is required.');
      }
      const viewerUserId = req.user?.userId;

      const profile = await this.service.getProfileByUsername(username, viewerUserId);

      res.status(200).json({
        status: 'success',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'Authentication required.');
      }

      const input: UpdateProfileInput = req.body;
      const profile = await this.service.updateProfile(req.user.userId, input);

      res.status(200).json({
        status: 'success',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const usersController = new UsersController();
