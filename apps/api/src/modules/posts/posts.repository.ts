import { prisma } from '../../lib/prisma.js';
import { CreatePostInput, PostDTO, CommentDTO, CommentThreadDTO, PaginatedResponse, PostActionResponseDTO } from '@social/shared';

export class PostsRepository {
  async createPost(authorId: string, input: CreatePostInput): Promise<PostDTO> {
    return prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId,
          content: input.content,
          replyToId: input.replyToId,
          repostOfId: input.repostOfId,
          media: input.media && input.media.length > 0
            ? {
                create: input.media.map((m, idx) => ({
                  mediaUrl: m.mediaUrl,
                  thumbnailUrl: m.thumbnailUrl,
                  mediaType: m.mediaType,
                  fileSize: m.fileSize,
                  width: m.width,
                  height: m.height,
                  orderIndex: m.orderIndex ?? idx,
                })),
              }
            : undefined,
        },
        include: {
          author: {
            include: {
              profile: true,
            },
          },
          media: {
            orderBy: { orderIndex: 'asc' },
          },
          repostOf: {
            include: {
              author: { include: { profile: true } },
              media: true,
            },
          },
        },
      });

      // Increment author's posts count
      await tx.profile.update({
        where: { userId: authorId },
        data: { postsCount: { increment: 1 } },
      });

      // If reply to target post, increment commentsCount on target
      if (input.replyToId) {
        await tx.post.update({
          where: { id: input.replyToId },
          data: { commentsCount: { increment: 1 } },
        });
      }

      // If repost of original post, increment repostsCount on original
      if (input.repostOfId) {
        await tx.post.update({
          where: { id: input.repostOfId },
          data: { repostsCount: { increment: 1 } },
        });
      }

      return this.mapToPostDTO(post);
    });
  }

  async findById(postId: string, viewerId?: string): Promise<PostDTO | null> {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        media: {
          orderBy: { orderIndex: 'asc' },
        },
        repostOf: {
          include: {
            author: { include: { profile: true } },
            media: true,
          },
        },
      },
    });

    if (!post) return null;

    let hasLiked = false;
    let hasBookmarked = false;
    let hasReposted = false;

    if (viewerId) {
      const [like, bookmark, repost] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_postId: { userId: viewerId, postId } },
        }),
        prisma.bookmark.findUnique({
          where: { userId_postId: { userId: viewerId, postId } },
        }),
        prisma.repost.findUnique({
          where: { userId_postId: { userId: viewerId, postId } },
        }),
      ]);

      hasLiked = !!like;
      hasBookmarked = !!bookmark;
      hasReposted = !!repost;
    }

    return this.mapToPostDTO(post, { hasLiked, hasBookmarked, hasReposted });
  }

  async getPosts(options: {
    cursor?: string;
    limit: number;
    authorId?: string;
    tag?: string;
    viewerId?: string;
  }): Promise<PaginatedResponse<PostDTO>> {
    const { cursor, limit, authorId, tag, viewerId } = options;

    let cursorDate: Date | undefined;
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        cursorDate = new Date(decoded);
      } catch {
        cursorDate = new Date(cursor);
      }
    }

    // Exclude posts from blocked users if viewer is logged in
    let blockedUserIds: string[] = [];
    if (viewerId) {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: viewerId }, { blockedId: viewerId }],
        },
        select: { blockerId: true, blockedId: true },
      });
      blockedUserIds = blocks.map((b) => (b.blockerId === viewerId ? b.blockedId : b.blockerId));
    }

    const posts = await prisma.post.findMany({
      where: {
        deletedAt: null,
        ...(authorId && { authorId }),
        ...(blockedUserIds.length > 0 && {
          authorId: { notIn: blockedUserIds },
        }),
        ...(cursorDate && {
          createdAt: {
            lt: cursorDate,
          },
        }),
        ...(tag && {
          content: {
            contains: `#${tag}`,
            mode: 'insensitive',
          },
        }),
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        media: {
          orderBy: { orderIndex: 'asc' },
        },
        repostOf: {
          include: {
            author: { include: { profile: true } },
            media: true,
          },
        },
      },
    });

    const hasNextPage = posts.length > limit;
    const items = hasNextPage ? posts.slice(0, limit) : posts;

    // Hydrate viewer reactions
    let likedPostIds = new Set<string>();
    let bookmarkedPostIds = new Set<string>();
    let repostedPostIds = new Set<string>();

    if (viewerId && items.length > 0) {
      const postIds = items.map((p) => p.id);

      const [likes, bookmarks, reposts] = await Promise.all([
        prisma.like.findMany({
          where: { userId: viewerId, postId: { in: postIds } },
          select: { postId: true },
        }),
        prisma.bookmark.findMany({
          where: { userId: viewerId, postId: { in: postIds } },
          select: { postId: true },
        }),
        prisma.repost.findMany({
          where: { userId: viewerId, postId: { in: postIds } },
          select: { postId: true },
        }),
      ]);

      likedPostIds = new Set(likes.map((l) => l.postId));
      bookmarkedPostIds = new Set(bookmarks.map((b) => b.postId));
      repostedPostIds = new Set(reposts.map((r) => r.postId));
    }

    const data: PostDTO[] = items.map((post) =>
      this.mapToPostDTO(post, {
        hasLiked: viewerId ? likedPostIds.has(post.id) : undefined,
        hasBookmarked: viewerId ? bookmarkedPostIds.has(post.id) : undefined,
        hasReposted: viewerId ? repostedPostIds.has(post.id) : undefined,
      })
    );

    const nextCursor =
      hasNextPage && items.length > 0
        ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString('base64')
        : null;

    return {
      data,
      pagination: {
        nextCursor,
        hasNextPage,
        limit,
      },
    };
  }

  async softDeletePost(postId: string, userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true, authorId: true, deletedAt: true },
      });

      if (post && !post.deletedAt) {
        await tx.post.update({
          where: { id: postId },
          data: { deletedAt: new Date() },
        });

        await tx.profile.updateMany({
          where: { userId: post.authorId, postsCount: { gt: 0 } },
          data: { postsCount: { decrement: 1 } },
        });
      }
    });
  }

  async toggleLike(userId: string, postId: string): Promise<PostActionResponseDTO> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.like.findUnique({
        where: { userId_postId: { userId, postId } },
      });

      let hasLiked = false;

      if (existing) {
        // Unlike
        await tx.like.delete({
          where: { userId_postId: { userId, postId } },
        });
        await tx.post.updateMany({
          where: { id: postId, likesCount: { gt: 0 } },
          data: { likesCount: { decrement: 1 } },
        });
        hasLiked = false;
      } else {
        // Like
        await tx.like.create({
          data: { userId, postId },
        });
        const updatedPost = await tx.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
          select: { authorId: true },
        });

        // Notify author if not self-like
        if (updatedPost.authorId !== userId) {
          await tx.notification.create({
            data: {
              recipientId: updatedPost.authorId,
              senderId: userId,
              type: 'LIKE',
              entityId: postId,
            },
          });
        }
        hasLiked = true;
      }

      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { likesCount: true, bookmarksCount: true, repostsCount: true },
      });

      return {
        postId,
        hasLiked,
        likesCount: post?.likesCount ?? 0,
        bookmarksCount: post?.bookmarksCount ?? 0,
        repostsCount: post?.repostsCount ?? 0,
      };
    });
  }

  async toggleBookmark(userId: string, postId: string): Promise<PostActionResponseDTO> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.bookmark.findUnique({
        where: { userId_postId: { userId, postId } },
      });

      let hasBookmarked = false;

      if (existing) {
        await tx.bookmark.delete({
          where: { userId_postId: { userId, postId } },
        });
        await tx.post.updateMany({
          where: { id: postId, bookmarksCount: { gt: 0 } },
          data: { bookmarksCount: { decrement: 1 } },
        });
        hasBookmarked = false;
      } else {
        await tx.bookmark.create({
          data: { userId, postId },
        });
        await tx.post.update({
          where: { id: postId },
          data: { bookmarksCount: { increment: 1 } },
        });
        hasBookmarked = true;
      }

      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { likesCount: true, bookmarksCount: true, repostsCount: true },
      });

      return {
        postId,
        hasBookmarked,
        likesCount: post?.likesCount ?? 0,
        bookmarksCount: post?.bookmarksCount ?? 0,
        repostsCount: post?.repostsCount ?? 0,
      };
    });
  }

  async toggleRepost(userId: string, postId: string): Promise<PostActionResponseDTO> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.repost.findUnique({
        where: { userId_postId: { userId, postId } },
      });

      let hasReposted = false;

      if (existing) {
        await tx.repost.delete({
          where: { userId_postId: { userId, postId } },
        });
        await tx.post.updateMany({
          where: { id: postId, repostsCount: { gt: 0 } },
          data: { repostsCount: { decrement: 1 } },
        });
        hasReposted = false;
      } else {
        await tx.repost.create({
          data: { userId, postId },
        });
        const updatedPost = await tx.post.update({
          where: { id: postId },
          data: { repostsCount: { increment: 1 } },
          select: { authorId: true },
        });

        if (updatedPost.authorId !== userId) {
          await tx.notification.create({
            data: {
              recipientId: updatedPost.authorId,
              senderId: userId,
              type: 'REPOST',
              entityId: postId,
            },
          });
        }
        hasReposted = true;
      }

      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { likesCount: true, bookmarksCount: true, repostsCount: true },
      });

      return {
        postId,
        hasReposted,
        likesCount: post?.likesCount ?? 0,
        bookmarksCount: post?.bookmarksCount ?? 0,
        repostsCount: post?.repostsCount ?? 0,
      };
    });
  }

  async createComment(data: {
    postId: string;
    authorId: string;
    content: string;
    parentId?: string | null;
  }): Promise<CommentDTO> {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          postId: data.postId,
          authorId: data.authorId,
          content: data.content,
          parentId: data.parentId,
        },
        include: {
          author: {
            include: { profile: true },
          },
        },
      });

      // Increment comments count on target post
      const targetPost = await tx.post.update({
        where: { id: data.postId },
        data: { commentsCount: { increment: 1 } },
        select: { authorId: true },
      });

      // Notify post author if not self-comment
      if (targetPost.authorId !== data.authorId) {
        await tx.notification.create({
          data: {
            recipientId: targetPost.authorId,
            senderId: data.authorId,
            type: 'COMMENT',
            entityId: data.postId,
          },
        });
      }

      return {
        id: comment.id,
        postId: comment.postId,
        authorId: comment.authorId,
        author: {
          id: comment.author.id,
          username: comment.author.username,
          displayName: comment.author.profile?.displayName ?? comment.author.username,
          avatarUrl: comment.author.profile?.avatarUrl,
        },
        parentId: comment.parentId,
        content: comment.content,
        likesCount: comment.likesCount,
        hasLiked: false,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      };
    });
  }

  async getCommentsByPostId(postId: string, viewerId?: string): Promise<CommentThreadDTO[]> {
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        deletedAt: null,
        parentId: null, // Top-level comments
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          include: { profile: true },
        },
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              include: { profile: true },
            },
          },
        },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      author: {
        id: c.author.id,
        username: c.author.username,
        displayName: c.author.profile?.displayName ?? c.author.username,
        avatarUrl: c.author.profile?.avatarUrl,
      },
      parentId: c.parentId,
      content: c.content,
      likesCount: c.likesCount,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      repliesCount: c.replies.length,
      replies: c.replies.map((r) => ({
        id: r.id,
        postId: r.postId,
        authorId: r.authorId,
        author: {
          id: r.author.id,
          username: r.author.username,
          displayName: r.author.profile?.displayName ?? r.author.username,
          avatarUrl: r.author.profile?.avatarUrl,
        },
        parentId: r.parentId,
        content: r.content,
        likesCount: r.likesCount,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToPostDTO(post: any, viewerFlags?: { hasLiked?: boolean; hasBookmarked?: boolean; hasReposted?: boolean }): PostDTO {
    return {
      id: post.id,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        username: post.author.username,
        displayName: post.author.profile?.displayName ?? post.author.username,
        avatarUrl: post.author.profile?.avatarUrl,
        isVerified: post.author.isVerified,
      },
      content: post.content,
      replyToId: post.replyToId,
      repostOfId: post.repostOfId,
      repostOf: post.repostOf ? this.mapToPostDTO(post.repostOf) : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      media: (post.media || []).map((m: any) => ({
        id: m.id,
        mediaUrl: m.mediaUrl,
        thumbnailUrl: m.thumbnailUrl,
        mediaType: m.mediaType,
        fileSize: m.fileSize,
        width: m.width,
        height: m.height,
        orderIndex: m.orderIndex,
      })),
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      repostsCount: post.repostsCount,
      bookmarksCount: post.bookmarksCount,
      hasLiked: viewerFlags?.hasLiked,
      hasBookmarked: viewerFlags?.hasBookmarked,
      hasReposted: viewerFlags?.hasReposted,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}

export const postsRepository = new PostsRepository();
