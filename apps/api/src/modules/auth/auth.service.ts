import { authRepository, AuthRepository } from './auth.repository.js';
import { hashPassword, verifyPassword, generateRandomToken, hashToken } from '../../utils/crypto.js';
import { signAccessToken, AuthTokenPayload } from '../../utils/jwt.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { RegisterInput, LoginInput, UserDTO, ProfileDTO, UserRole } from '@social/shared';
import { logger } from '../../lib/logger.js';
import { User, Profile } from '@prisma/client';

export interface AuthResult {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  private mapToUserDTO(user: User & { profile: Profile | null }): UserDTO {
    const profile: ProfileDTO | undefined = user.profile
      ? {
          id: user.profile.id,
          userId: user.profile.userId,
          displayName: user.profile.displayName,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          bannerUrl: user.profile.bannerUrl,
          location: user.profile.location,
          website: user.profile.website,
          followersCount: user.profile.followersCount,
          followingCount: user.profile.followingCount,
          postsCount: user.profile.postsCount,
          createdAt: user.profile.createdAt.toISOString(),
          updatedAt: user.profile.updatedAt.toISOString(),
        }
      : undefined;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role as UserRole,
      isVerified: user.isVerified,
      isPrivate: user.isPrivate,
      createdAt: user.createdAt.toISOString(),
      profile,
    };
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    // 1. Check existing email or username
    const existingEmail = await this.repo.findByEmail(input.email);
    if (existingEmail) {
      throw new AppError(409, 'Email Already Registered', 'An account with this email address already exists.');
    }

    const existingUsername = await this.repo.findByUsername(input.username);
    if (existingUsername) {
      throw new AppError(409, 'Username Taken', 'This username is already taken. Please choose another.');
    }

    // 2. Hash password with Argon2id
    const passwordHash = await hashPassword(input.password);

    // 3. Create user & profile in database
    const user = await this.repo.createUser({
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash,
    });

    // 4. Issue initial tokens
    const tokenPayload: AuthTokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role as UserRole,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = signAccessToken(tokenPayload);
    const rawRefreshToken = generateRandomToken(32);
    const hashedRefresh = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.repo.saveRefreshToken(user.id, hashedRefresh, expiresAt);

    logger.info({ userId: user.id, username: user.username }, '👤 New user registered successfully');

    return {
      user: this.mapToUserDTO(user),
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    // 1. Find user by email or username
    const user = await this.repo.findByIdentifier(input.identifier);
    if (!user || user.deletedAt) {
      throw new AppError(401, 'Invalid Credentials', 'The email/username or password provided is incorrect.');
    }

    // 2. Verify password with Argon2id
    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      throw new AppError(401, 'Invalid Credentials', 'The email/username or password provided is incorrect.');
    }

    // 3. Generate tokens
    const tokenPayload: AuthTokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role as UserRole,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = signAccessToken(tokenPayload);
    const rawRefreshToken = generateRandomToken(32);
    const hashedRefresh = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.repo.saveRefreshToken(user.id, hashedRefresh, expiresAt);

    logger.info({ userId: user.id, username: user.username }, '🔓 User logged in successfully');

    return {
      user: this.mapToUserDTO(user),
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async refreshTokens(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const hashedToken = hashToken(rawRefreshToken);
    const tokenRecord = await this.repo.findRefreshToken(hashedToken);

    if (!tokenRecord) {
      // Possible token reuse attack or invalid token
      logger.warn('⚠️ Invalid or already-used refresh token submitted');
      throw new AppError(401, 'Invalid Refresh Token', 'The refresh token provided is invalid or has expired.');
    }

    // Check expiration
    if (new Date() > tokenRecord.expiresAt) {
      await this.repo.deleteRefreshToken(tokenRecord.id);
      throw new AppError(401, 'Refresh Token Expired', 'Session has expired. Please log in again.');
    }

    const user = tokenRecord.user;
    if (user.deletedAt) {
      throw new AppError(401, 'User Deactivated', 'User account is deactivated.');
    }

    // Single-use token rotation: Delete old token and issue new pair
    await this.repo.deleteRefreshToken(tokenRecord.id);

    const tokenPayload: AuthTokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role as UserRole,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = signAccessToken(tokenPayload);
    const newRawRefreshToken = generateRandomToken(32);
    const newHashedRefresh = hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.repo.saveRefreshToken(user.id, newHashedRefresh, expiresAt);

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    try {
      const hashed = hashToken(rawRefreshToken);
      const record = await this.repo.findRefreshToken(hashed);
      if (record) {
        await this.repo.deleteRefreshToken(record.id);
      }
    } catch {
      // Silent ignore on logout
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.repo.revokeAllUserSessions(userId);
    logger.info({ userId }, '🔒 All active sessions revoked for user');
  }

  async getCurrentUser(userId: string): Promise<UserDTO> {
    const user = await this.repo.findById(userId);
    if (!user || user.deletedAt) {
      throw new AppError(404, 'User Not Found', 'The requested user profile was not found.');
    }
    return this.mapToUserDTO(user);
  }
}

export const authService = new AuthService();
