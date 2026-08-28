import { z } from 'zod';
import { APP_LIMITS, MEDIA_TYPES } from '../constants/index.js';

export const MediaAttachmentSchema = z.object({
  mediaUrl: z.string().url('Invalid media URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional().nullable(),
  mediaType: z.enum([MEDIA_TYPES.IMAGE, MEDIA_TYPES.VIDEO, MEDIA_TYPES.GIF]),
  fileSize: z.number().positive(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  orderIndex: z.number().int().min(0).default(0),
});

export const CreatePostSchema = z.object({
  content: z
    .string({ required_error: 'Content is required' })
    .min(1, 'Post cannot be empty')
    .max(APP_LIMITS.MAX_POST_LENGTH, `Post cannot exceed ${APP_LIMITS.MAX_POST_LENGTH} characters`)
    .trim(),
  replyToId: z.string().uuid('Invalid reply target ID').optional().nullable(),
  repostOfId: z.string().uuid('Invalid repost target ID').optional().nullable(),
  media: z.array(MediaAttachmentSchema).max(APP_LIMITS.MAX_MEDIA_PER_POST, `Maximum ${APP_LIMITS.MAX_MEDIA_PER_POST} attachments allowed`).optional(),
});

export const PresignedUrlRequestSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255),
  fileType: z.string().regex(/^(image\/(jpeg|png|webp|gif)|video\/(mp4|quicktime|webm))$/, 'Unsupported media type'),
  fileSize: z
    .number()
    .positive()
    .max(APP_LIMITS.MAX_VIDEO_SIZE_BYTES, 'File size exceeds allowed maximum'),
});

export const PostFeedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .min(1)
    .max(APP_LIMITS.MAX_PAGE_SIZE)
    .default(APP_LIMITS.DEFAULT_PAGE_SIZE),
  authorUsername: z.string().optional(),
  tag: z.string().optional(),
});

export const PostIdParamSchema = z.object({
  id: z.string().uuid('Invalid post ID format'),
});

export type MediaAttachmentInput = z.infer<typeof MediaAttachmentSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type PresignedUrlRequestInput = z.infer<typeof PresignedUrlRequestSchema>;
export type PostFeedQueryInput = z.infer<typeof PostFeedQuerySchema>;
export type PostIdParamInput = z.infer<typeof PostIdParamSchema>;
