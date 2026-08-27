import { z } from 'zod';
import { APP_LIMITS } from '../constants/index.js';

export const CreateCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .min(1, 'Comment cannot be empty')
    .max(APP_LIMITS.MAX_COMMENT_LENGTH, `Comment cannot exceed ${APP_LIMITS.MAX_COMMENT_LENGTH} characters`)
    .trim(),
  parentId: z.string().uuid('Invalid parent comment ID').optional().nullable(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
