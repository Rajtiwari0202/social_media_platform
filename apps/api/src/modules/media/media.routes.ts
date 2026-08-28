import { Router } from 'express';
import { mediaController } from './media.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { PresignedUrlRequestSchema } from '@social/shared';

export const mediaRouter = Router();

mediaRouter.post(
  '/presigned-url',
  authenticate,
  validateRequest({ body: PresignedUrlRequestSchema }),
  mediaController.getPresignedUrl
);
