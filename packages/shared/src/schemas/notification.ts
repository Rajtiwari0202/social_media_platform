import { z } from 'zod';
import { NOTIFICATION_TYPES } from '../constants/index.js';

export const NotificationFilterSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  type: z.nativeEnum(NOTIFICATION_TYPES).optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

export type NotificationFilterInput = z.infer<typeof NotificationFilterSchema>;
