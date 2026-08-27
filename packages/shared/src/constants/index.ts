export const USER_ROLES = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const NOTIFICATION_TYPES = {
  LIKE: 'LIKE',
  COMMENT: 'COMMENT',
  FOLLOW: 'FOLLOW',
  MENTION: 'MENTION',
  REPOST: 'REPOST',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const MEDIA_TYPES = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  GIF: 'GIF',
} as const;

export type MediaType = (typeof MEDIA_TYPES)[keyof typeof MEDIA_TYPES];

export const APP_LIMITS = {
  MAX_POST_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 1000,
  MAX_BIO_LENGTH: 300,
  MAX_DISPLAY_NAME_LENGTH: 64,
  MAX_MEDIA_PER_POST: 4,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE_BYTES: 100 * 1024 * 1024, // 100MB
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
} as const;

export const API_ROUTES = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    ME: '/auth/me',
  },
  USERS: {
    PROFILE: '/users/profile',
    BY_USERNAME: (username: string) => `/users/${username}`,
    FOLLOW: (username: string) => `/users/${username}/follow`,
    FOLLOWERS: (username: string) => `/users/${username}/followers`,
    FOLLOWING: (username: string) => `/users/${username}/following`,
    BLOCK: (username: string) => `/users/${username}/block`,
  },
  POSTS: {
    BASE: '/posts',
    BY_ID: (id: string) => `/posts/${id}`,
    LIKE: (id: string) => `/posts/${id}/like`,
    BOOKMARK: (id: string) => `/posts/${id}/bookmark`,
    REPOST: (id: string) => `/posts/${id}/repost`,
    COMMENTS: (id: string) => `/posts/${id}/comments`,
  },
  FEED: {
    TIMELINE: '/feed/timeline',
    FOR_YOU: '/feed/for-you',
    USER: (username: string) => `/feed/user/${username}`,
  },
  MEDIA: {
    PRESIGNED_URL: '/media/presigned-url',
    CONFIRM: '/media/confirm',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    READ_ALL: '/notifications/read-all',
  },
  CHAT: {
    ROOMS: '/chat/rooms',
    MESSAGES: (roomId: string) => `/chat/rooms/${roomId}/messages`,
  },
} as const;
