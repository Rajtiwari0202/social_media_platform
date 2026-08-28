import { usersRepository, UsersRepository, UserProfileWithUser } from './users.repository.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { UpdateProfileInput, ProfileDTO } from '@social/shared';
import { prisma } from '../../lib/prisma.js';

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  private async mapToProfileDTO(
    profile: UserProfileWithUser,
    viewerUserId?: string
  ): Promise<ProfileDTO & { username: string; isVerified: boolean; isPrivate: boolean }> {
    let isFollowing = false;
    let isFollowedBy = false;
    let isBlocked = false;
    let isMuted = false;

    if (viewerUserId && viewerUserId !== profile.userId) {
      const [followingRelation, followedByRelation, blockRelation, muteRelation] = await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerUserId,
              followingId: profile.userId,
            },
          },
        }),
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: profile.userId,
              followingId: viewerUserId,
            },
          },
        }),
        prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: viewerUserId, blockedId: profile.userId },
              { blockerId: profile.userId, blockedId: viewerUserId },
            ],
          },
        }),
        prisma.mute.findUnique({
          where: {
            muterId_mutedId: {
              muterId: viewerUserId,
              mutedId: profile.userId,
            },
          },
        }),
      ]);

      isFollowing = !!followingRelation;
      isFollowedBy = !!followedByRelation;
      isBlocked = !!blockRelation;
      isMuted = !!muteRelation;
    }

    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.user.username,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
      location: profile.location,
      website: profile.website,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      postsCount: profile.postsCount,
      isVerified: profile.user.isVerified,
      isPrivate: profile.user.isPrivate,
      isFollowing,
      isFollowedBy,
      isBlocked,
      isMuted,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  async getProfileByUsername(username: string, viewerUserId?: string) {
    const profile = await this.repo.findByUsername(username);
    if (!profile) {
      throw new AppError(404, 'User Not Found', `User '@${username}' does not exist.`);
    }

    if (viewerUserId && viewerUserId !== profile.userId) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: viewerUserId, blockedId: profile.userId },
            { blockerId: profile.userId, blockedId: viewerUserId },
          ],
        },
      });

      if (block) {
        throw new AppError(404, 'User Not Found', `User '@${username}' does not exist.`);
      }
    }

    return this.mapToProfileDTO(profile, viewerUserId);
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new AppError(404, 'User Not Found', 'User profile not found.');
    }

    const updated = await this.repo.updateProfile(userId, data);
    return this.mapToProfileDTO(updated, userId);
  }
}

export const usersService = new UsersService();
