import { prisma } from '../../lib/prisma.js';
import { User, Profile, RefreshToken } from '@prisma/client';

export class AuthRepository {
  async findByEmail(email: string): Promise<(User & { profile: Profile | null }) | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
  }

  async findByUsername(username: string): Promise<(User & { profile: Profile | null }) | null> {
    return prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: { profile: true },
    });
  }

  async findByIdentifier(identifier: string): Promise<(User & { profile: Profile | null }) | null> {
    const isEmail = identifier.includes('@');
    if (isEmail) {
      return this.findByEmail(identifier);
    }
    return this.findByUsername(identifier);
  }

  async findById(id: string): Promise<(User & { profile: Profile | null }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async createUser(data: {
    email: string;
    username: string;
    displayName: string;
    passwordHash: string;
  }): Promise<User & { profile: Profile | null }> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          username: data.username.toLowerCase(),
          passwordHash: data.passwordHash,
          profile: {
            create: {
              displayName: data.displayName,
            },
          },
        },
        include: { profile: true },
      });
      return user;
    });
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findRefreshToken(tokenHash: string): Promise<(RefreshToken & { user: User }) | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async deleteRefreshToken(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.delete({
      where: { id },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);
  }
}

export const authRepository = new AuthRepository();
