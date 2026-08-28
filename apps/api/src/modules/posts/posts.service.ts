import { postsRepository, PostsRepository } from './posts.repository.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { CreatePostInput, PostFeedQueryInput, CreateCommentInput, PostDTO, PostActionResponseDTO } from '@social/shared';
import { logger } from '../../lib/logger.js';

export class PostsService {
  constructor(private readonly repo: PostsRepository = postsRepository) {}

  async createPost(authorId: string, input: CreatePostInput): Promise<PostDTO> {
    // 1. Create post in database
    const post = await this.repo.createPost(authorId, input);

    // 2. Parse @mentions from content and notify mentioned users
    const mentionRegex = /@([a-zA-Z0-9_]{3,30})/g;
    const matches = Array.from(input.content.matchAll(mentionRegex));
    const mentionedUsernames = Array.from(new Set(matches.map((m) => m[1].toLowerCase())));

    if (mentionedUsernames.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          username: { in: mentionedUsernames },
          id: { not: authorId },
          deletedAt: null,
        },
        select: { id: true },
      });

      if (mentionedUsers.length > 0) {
        await prisma.notification.createMany({
          data: mentionedUsers.map((u) => ({
            recipientId: u.id,
            senderId: authorId,
            type: 'MENTION',
            entityId: post.id,
          })),
        });
      }
    }

    logger.info({ postId: post.id, authorId }, '📝 New post published');
    return post;
  }

  async getPostById(postId: string, viewerId?: string): Promise<PostDTO> {
    const post = await this.repo.findById(postId, viewerId);
    if (!post) {
      throw new AppError(404, 'Post Not Found', 'The requested post does not exist or was deleted.');
    }

    // Check block between viewer and author
    if (viewerId && viewerId !== post.authorId) {
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: post.authorId },
            { blockerId: post.authorId, blockedId: viewerId },
          ],
        },
      });

      if (isBlocked) {
        throw new AppError(404, 'Post Not Found', 'The requested post does not exist or was deleted.');
      }
    }

    return post;
  }

  async getFeed(query: PostFeedQueryInput, viewerId?: string) {
    let authorId: string | undefined;

    if (query.authorUsername) {
      const author = await prisma.user.findUnique({
        where: { username: query.authorUsername.toLowerCase() },
        select: { id: true },
      });
      if (!author) {
        throw new AppError(404, 'User Not Found', `User '@${query.authorUsername}' does not exist.`);
      }
      authorId = author.id;
    }

    return this.repo.getPosts({
      cursor: query.cursor,
      limit: query.limit,
      authorId,
      tag: query.tag,
      viewerId,
    });
  }

  async deletePost(postId: string, userId: string, userRole: string): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, deletedAt: true },
    });

    if (!post || post.deletedAt) {
      throw new AppError(404, 'Post Not Found', 'The post could not be found.');
    }

    if (post.authorId !== userId && userRole !== 'ADMIN') {
      throw new AppError(403, 'Forbidden', 'You do not have permission to delete this post.');
    }

    await this.repo.softDeletePost(postId, post.authorId);
    logger.info({ postId, userId }, '🗑️ Post soft-deleted');
  }

  async toggleLike(userId: string, postId: string): Promise<PostActionResponseDTO> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, deletedAt: true },
    });

    if (!post || post.deletedAt) {
      throw new AppError(404, 'Post Not Found', 'Post not found.');
    }

    return this.repo.toggleLike(userId, postId);
  }

  async toggleBookmark(userId: string, postId: string): Promise<PostActionResponseDTO> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, deletedAt: true },
    });

    if (!post || post.deletedAt) {
      throw new AppError(404, 'Post Not Found', 'Post not found.');
    }

    return this.repo.toggleBookmark(userId, postId);
  }

  async toggleRepost(userId: string, postId: string): Promise<PostActionResponseDTO> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, deletedAt: true },
    });

    if (!post || post.deletedAt) {
      throw new AppError(404, 'Post Not Found', 'Post not found.');
    }

    return this.repo.toggleRepost(userId, postId);
  }

  async createComment(postId: string, authorId: string, input: CreateCommentInput) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, deletedAt: true },
    });

    if (!post || post.deletedAt) {
      throw new AppError(404, 'Post Not Found', 'Post not found.');
    }

    if (input.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: input.parentId },
        select: { id: true, postId: true, deletedAt: true },
      });

      if (!parentComment || parentComment.deletedAt || parentComment.postId !== postId) {
        throw new AppError(400, 'Invalid Parent Comment', 'Parent comment does not exist on this post.');
      }
    }

    return this.repo.createComment({
      postId,
      authorId,
      content: input.content,
      parentId: input.parentId,
    });
  }

  async getPostComments(postId: string, viewerId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, deletedAt: true },
    });

    if (!post || post.deletedAt) {
      throw new AppError(404, 'Post Not Found', 'Post not found.');
    }

    return this.repo.getCommentsByPostId(postId, viewerId);
  }
}

export const postsService = new PostsService();
