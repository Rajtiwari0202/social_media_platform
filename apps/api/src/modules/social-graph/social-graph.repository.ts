import { prisma } from '../../lib/prisma.js';
import { UserSummaryDTO, PaginatedResponse, RelationshipStatusDTO } from '@social/shared';

export class SocialGraphRepository {
  async findUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: { profile: true },
    });
  }

  async checkRelationship(userAId: string, userBId: string): Promise<RelationshipStatusDTO> {
    const [following, followedBy, blocked, muted] = await Promise.all([
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userAId, followingId: userBId } },
      }),
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userBId, followingId: userAId } },
      }),
      prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userAId, blockedId: userBId },
            { blockerId: userBId, blockedId: userAId },
          ],
        },
      }),
      prisma.mute.findUnique({
        where: { muterId_mutedId: { muterId: userAId, mutedId: userBId } },
      }),
    ]);

    return {
      isFollowing: !!following,
      isFollowedBy: !!followedBy,
      isBlocked: !!blocked,
      isMuted: !!muted,
    };
  }

  async isBlocked(userAId: string, userBId: string): Promise<boolean> {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
    });
    return !!block;
  }

  async followUser(followerId: string, followingId: string): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number }> {
    return prisma.$transaction(async (tx) => {
      // 1. Check if already following
      const existing = await tx.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId } },
      });

      if (!existing) {
        // Create follow relation
        await tx.follow.create({
          data: {
            followerId,
            followingId,
          },
        });

        // Increment follower's followingCount
        await tx.profile.update({
          where: { userId: followerId },
          data: { followingCount: { increment: 1 } },
        });

        // Increment target's followersCount
        await tx.profile.update({
          where: { userId: followingId },
          data: { followersCount: { increment: 1 } },
        });

        // Create follow notification
        await tx.notification.create({
          data: {
            recipientId: followingId,
            senderId: followerId,
            type: 'FOLLOW',
          },
        });
      }

      const targetProfile = await tx.profile.findUnique({
        where: { userId: followingId },
        select: { followersCount: true, followingCount: true },
      });

      return {
        isFollowing: true,
        followersCount: targetProfile?.followersCount ?? 0,
        followingCount: targetProfile?.followingCount ?? 0,
      };
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<{ isFollowing: boolean; followersCount: number; followingCount: number }> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId } },
      });

      if (existing) {
        // Delete follow relation
        await tx.follow.delete({
          where: { followerId_followingId: { followerId, followingId } },
        });

        // Decrement follower's followingCount (ensure not negative)
        await tx.profile.updateMany({
          where: { userId: followerId, followingCount: { gt: 0 } },
          data: { followingCount: { decrement: 1 } },
        });

        // Decrement target's followersCount (ensure not negative)
        await tx.profile.updateMany({
          where: { userId: followingId, followersCount: { gt: 0 } },
          data: { followersCount: { decrement: 1 } },
        });
      }

      const targetProfile = await tx.profile.findUnique({
        where: { userId: followingId },
        select: { followersCount: true, followingCount: true },
      });

      return {
        isFollowing: false,
        followersCount: targetProfile?.followersCount ?? 0,
        followingCount: targetProfile?.followingCount ?? 0,
      };
    });
  }

  async getFollowers(
    targetUserId: string,
    options: { cursor?: string; limit: number; search?: string; viewerId?: string }
  ): Promise<PaginatedResponse<UserSummaryDTO>> {
    const { cursor, limit, search, viewerId } = options;

    let cursorDate: Date | undefined;
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        cursorDate = new Date(decoded);
      } catch {
        // Fallback to direct ISO string
        cursorDate = new Date(cursor);
      }
    }

    const followers = await prisma.follow.findMany({
      where: {
        followingId: targetUserId,
        ...(cursorDate && {
          createdAt: {
            lt: cursorDate,
          },
        }),
        ...(search && {
          follower: {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { profile: { displayName: { contains: search, mode: 'insensitive' } } },
            ],
          },
        }),
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          include: {
            profile: true,
          },
        },
      },
    });

    const hasNextPage = followers.length > limit;
    const items = hasNextPage ? followers.slice(0, limit) : followers;

    // Hydrate viewer relationships if logged in
    let viewerFollowingSet = new Set<string>();
    let viewerFollowedBySet = new Set<string>();

    if (viewerId && items.length > 0) {
      const followerUserIds = items.map((f) => f.followerId);

      const [followingRelations, followedByRelations] = await Promise.all([
        prisma.follow.findMany({
          where: {
            followerId: viewerId,
            followingId: { in: followerUserIds },
          },
          select: { followingId: true },
        }),
        prisma.follow.findMany({
          where: {
            followerId: { in: followerUserIds },
            followingId: viewerId,
          },
          select: { followerId: true },
        }),
      ]);

      viewerFollowingSet = new Set(followingRelations.map((r) => r.followingId));
      viewerFollowedBySet = new Set(followedByRelations.map((r) => r.followerId));
    }

    const data: UserSummaryDTO[] = items.map((item) => ({
      id: item.follower.id,
      username: item.follower.username,
      displayName: item.follower.profile?.displayName ?? item.follower.username,
      avatarUrl: item.follower.profile?.avatarUrl,
      bio: item.follower.profile?.bio,
      isVerified: item.follower.isVerified,
      isFollowing: viewerId ? viewerFollowingSet.has(item.follower.id) : undefined,
      isFollowedBy: viewerId ? viewerFollowedBySet.has(item.follower.id) : undefined,
      followedAt: item.createdAt.toISOString(),
    }));

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

  async getFollowing(
    targetUserId: string,
    options: { cursor?: string; limit: number; search?: string; viewerId?: string }
  ): Promise<PaginatedResponse<UserSummaryDTO>> {
    const { cursor, limit, search, viewerId } = options;

    let cursorDate: Date | undefined;
    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        cursorDate = new Date(decoded);
      } catch {
        cursorDate = new Date(cursor);
      }
    }

    const following = await prisma.follow.findMany({
      where: {
        followerId: targetUserId,
        ...(cursorDate && {
          createdAt: {
            lt: cursorDate,
          },
        }),
        ...(search && {
          following: {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { profile: { displayName: { contains: search, mode: 'insensitive' } } },
            ],
          },
        }),
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          include: {
            profile: true,
          },
        },
      },
    });

    const hasNextPage = following.length > limit;
    const items = hasNextPage ? following.slice(0, limit) : following;

    let viewerFollowingSet = new Set<string>();
    let viewerFollowedBySet = new Set<string>();

    if (viewerId && items.length > 0) {
      const followingUserIds = items.map((f) => f.followingId);

      const [followingRelations, followedByRelations] = await Promise.all([
        prisma.follow.findMany({
          where: {
            followerId: viewerId,
            followingId: { in: followingUserIds },
          },
          select: { followingId: true },
        }),
        prisma.follow.findMany({
          where: {
            followerId: { in: followingUserIds },
            followingId: viewerId,
          },
          select: { followerId: true },
        }),
      ]);

      viewerFollowingSet = new Set(followingRelations.map((r) => r.followingId));
      viewerFollowedBySet = new Set(followedByRelations.map((r) => r.followerId));
    }

    const data: UserSummaryDTO[] = items.map((item) => ({
      id: item.following.id,
      username: item.following.username,
      displayName: item.following.profile?.displayName ?? item.following.username,
      avatarUrl: item.following.profile?.avatarUrl,
      bio: item.following.profile?.bio,
      isVerified: item.following.isVerified,
      isFollowing: viewerId ? viewerFollowingSet.has(item.following.id) : undefined,
      isFollowedBy: viewerId ? viewerFollowedBySet.has(item.following.id) : undefined,
      followedAt: item.createdAt.toISOString(),
    }));

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

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Create block relation
      const existingBlock = await tx.block.findUnique({
        where: { blockerId_blockedId: { blockerId, blockedId } },
      });

      if (!existingBlock) {
        await tx.block.create({
          data: { blockerId, blockedId },
        });
      }

      // 2. Cascade unfollow: Blocker unfollows Blocked
      const blockerFollowing = await tx.follow.findUnique({
        where: { followerId_followingId: { followerId: blockerId, followingId: blockedId } },
      });
      if (blockerFollowing) {
        await tx.follow.delete({
          where: { followerId_followingId: { followerId: blockerId, followingId: blockedId } },
        });
        await tx.profile.updateMany({
          where: { userId: blockerId, followingCount: { gt: 0 } },
          data: { followingCount: { decrement: 1 } },
        });
        await tx.profile.updateMany({
          where: { userId: blockedId, followersCount: { gt: 0 } },
          data: { followersCount: { decrement: 1 } },
        });
      }

      // 3. Cascade unfollow: Blocked unfollows Blocker
      const blockedFollowing = await tx.follow.findUnique({
        where: { followerId_followingId: { followerId: blockedId, followingId: blockerId } },
      });
      if (blockedFollowing) {
        await tx.follow.delete({
          where: { followerId_followingId: { followerId: blockedId, followingId: blockerId } },
        });
        await tx.profile.updateMany({
          where: { userId: blockedId, followingCount: { gt: 0 } },
          data: { followingCount: { decrement: 1 } },
        });
        await tx.profile.updateMany({
          where: { userId: blockerId, followersCount: { gt: 0 } },
          data: { followersCount: { decrement: 1 } },
        });
      }
    });
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) {
      await prisma.block.delete({
        where: { blockerId_blockedId: { blockerId, blockedId } },
      });
    }
  }

  async muteUser(muterId: string, mutedId: string): Promise<void> {
    const existing = await prisma.mute.findUnique({
      where: { muterId_mutedId: { muterId, mutedId } },
    });
    if (!existing) {
      await prisma.mute.create({
        data: { muterId, mutedId },
      });
    }
  }

  async unmuteUser(muterId: string, mutedId: string): Promise<void> {
    const existing = await prisma.mute.findUnique({
      where: { muterId_mutedId: { muterId, mutedId } },
    });
    if (existing) {
      await prisma.mute.delete({
        where: { muterId_mutedId: { muterId, mutedId } },
      });
    }
  }
}

export const socialGraphRepository = new SocialGraphRepository();
