import { prisma } from '../../lib/prisma.js';
import { Profile, User } from '@prisma/client';
import { UpdateProfileInput } from '@social/shared';

export interface UserProfileWithUser extends Profile {
  user: Pick<User, 'id' | 'username' | 'email' | 'isVerified' | 'isPrivate' | 'createdAt'>;
}

export class UsersRepository {
  async findByUsername(username: string): Promise<UserProfileWithUser | null> {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        profile: true,
      },
    });

    if (!user || user.deletedAt || !user.profile) {
      return null;
    }

    return {
      ...user.profile,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        isPrivate: user.isPrivate,
        createdAt: user.createdAt,
      },
    };
  }

  async findById(userId: string): Promise<UserProfileWithUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user || user.deletedAt || !user.profile) {
      return null;
    }

    return {
      ...user.profile,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        isPrivate: user.isPrivate,
        createdAt: user.createdAt,
      },
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfileWithUser> {
    return prisma.$transaction(async (tx) => {
      if (data.isPrivate !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { isPrivate: data.isPrivate },
        });
      }

      const updatedProfile = await tx.profile.update({
        where: { userId },
        data: {
          ...(data.displayName !== undefined && { displayName: data.displayName }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
          ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.website !== undefined && { website: data.website }),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              isVerified: true,
              isPrivate: true,
              createdAt: true,
            },
          },
        },
      });

      return updatedProfile;
    });
  }
}

export const usersRepository = new UsersRepository();
