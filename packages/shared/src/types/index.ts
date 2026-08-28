import { UserRole, NotificationType, MediaType } from '../constants/index.js';

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isVerified: boolean;
  isPrivate: boolean;
  createdAt: string;
  profile?: ProfileDTO;
}

export interface ProfileDTO {
  id: string;
  userId: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  location?: string | null;
  website?: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
  isMuted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummaryDTO {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  isVerified: boolean;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  followedAt?: string;
}

export interface RelationshipStatusDTO {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isBlocked: boolean;
  isMuted: boolean;
}

export interface FollowResponseDTO {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export interface MediaDTO {
  id: string;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  mediaType: MediaType;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  orderIndex: number;
}

export interface PostDTO {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isVerified: boolean;
  };
  content: string;
  replyToId?: string | null;
  repostOfId?: string | null;
  repostOf?: PostDTO | null;
  media: MediaDTO[];
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount: number;
  hasLiked?: boolean;
  hasBookmarked?: boolean;
  hasReposted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: string;
  postId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  parentId?: string | null;
  content: string;
  likesCount: number;
  hasLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PresignedUrlResponseDTO {
  uploadUrl: string;
  mediaKey: string;
  publicUrl: string;
  expiresIn: number;
}

export interface PostActionResponseDTO {
  postId: string;
  hasLiked?: boolean;
  hasBookmarked?: boolean;
  hasReposted?: boolean;
  likesCount: number;
  bookmarksCount: number;
  repostsCount: number;
}

export interface CommentThreadDTO extends CommentDTO {
  replies?: CommentDTO[];
  repliesCount?: number;
}

export interface NotificationDTO {
  id: string;
  recipientId: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  type: NotificationType;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
    limit: number;
    totalCount?: number;
  };
}

export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  invalidParams?: Array<{
    name: string;
    reason: string;
  }>;
  timestamp: string;
}
