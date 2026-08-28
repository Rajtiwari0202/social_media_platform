import crypto from 'crypto';
import path from 'path';
import { generatePresignedUploadUrl } from '../../lib/s3.js';
import { env } from '../../config/env.js';
import { PresignedUrlRequestInput, PresignedUrlResponseDTO } from '@social/shared';
import { AppError } from '../../middlewares/error.middleware.js';

export class MediaService {
  async createPresignedUploadUrl(userId: string, input: PresignedUrlRequestInput): Promise<PresignedUrlResponseDTO> {
    const { fileName, fileType } = input;

    const ext = path.extname(fileName) || this.getExtensionFromMime(fileType);
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const mediaKey = `uploads/${userId}/${Date.now()}-${randomSuffix}${ext}`;

    const expiresIn = 300; // 5 minutes
    const uploadUrl = await generatePresignedUploadUrl(mediaKey, fileType, expiresIn);
    const publicUrl = `${env.S3_PUBLIC_URL}/${mediaKey}`;

    return {
      uploadUrl,
      mediaKey,
      publicUrl,
      expiresIn,
    };
  }

  private getExtensionFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/webm': '.webm',
    };
    return map[mime] || '.bin';
  }
}

export const mediaService = new MediaService();
