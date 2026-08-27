import { z } from 'zod';
import { APP_LIMITS } from '../constants/index.js';

export const UpdateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name cannot be empty')
    .max(APP_LIMITS.MAX_DISPLAY_NAME_LENGTH, 'Display name too long')
    .trim()
    .optional(),
  bio: z
    .string()
    .max(APP_LIMITS.MAX_BIO_LENGTH, 'Bio cannot exceed 300 characters')
    .optional()
    .nullable(),
  avatarUrl: z
    .string()
    .url('Invalid avatar URL')
    .optional()
    .nullable(),
  bannerUrl: z
    .string()
    .url('Invalid banner URL')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(100, 'Location too long')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('Invalid website URL')
    .max(255, 'Website URL too long')
    .optional()
    .nullable(),
  isPrivate: z.boolean().optional(),
});

export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .min(1)
    .max(APP_LIMITS.MAX_PAGE_SIZE)
    .default(APP_LIMITS.DEFAULT_PAGE_SIZE),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type PaginationQueryInput = z.infer<typeof PaginationQuerySchema>;
