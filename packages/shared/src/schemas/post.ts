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

export type MediaAttachmentInput = z.infer<typeof MediaAttachmentSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
