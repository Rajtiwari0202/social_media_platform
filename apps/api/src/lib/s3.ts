import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO local compatibility
});

/**
 * Generate a presigned PUT URL for direct client-to-S3/MinIO upload
 */
export const generatePresignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return url;
  } catch (error) {
    logger.error({ error, key }, 'Failed to generate S3 presigned upload URL');
    throw error;
  }
};
