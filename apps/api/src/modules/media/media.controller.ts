import { Request, Response, NextFunction } from 'express';
import { mediaService, MediaService } from './media.service.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { PresignedUrlRequestInput } from '@social/shared';

export class MediaController {
  constructor(private readonly service: MediaService = mediaService) {}

  getPresignedUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'Authentication required to upload media.');
      }

      const input: PresignedUrlRequestInput = req.body;
      const result = await this.service.createPresignedUploadUrl(req.user.userId, input);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const mediaController = new MediaController();
