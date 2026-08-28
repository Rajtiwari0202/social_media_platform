import { socialGraphRepository, SocialGraphRepository } from './social-graph.repository.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { FollowersQueryInput, UserSummaryDTO, PaginatedResponse, FollowResponseDTO } from '@social/shared';
import { logger } from '../../lib/logger.js';

export class SocialGraphService {
  constructor(private readonly repo: SocialGraphRepository = socialGraphRepository) {}

  private async getTargetUserOrThrow(username: string) {
    const targetUser = await this.repo.findUserByUsername(username);
    if (!targetUser || targetUser.deletedAt) {
      throw new AppError(404, 'User Not Found', `User '@${username}' does not exist.`);
    }
    return targetUser;
  }

  async followUser(followerId: string, targetUsername: string): Promise<FollowResponseDTO> {
    const targetUser = await this.getTargetUserOrThrow(targetUsername);

    if (followerId === targetUser.id) {
      throw new AppError(400, 'Invalid Action', 'You cannot follow yourself.');
    }

    const isBlocked = await this.repo.isBlocked(followerId, targetUser.id);
    if (isBlocked) {
      throw new AppError(403, 'Action Forbidden', 'Cannot follow this user due to privacy blocks.');
    }

    const result = await this.repo.followUser(followerId, targetUser.id);

    logger.info({ followerId, followingId: targetUser.id, targetUsername }, '🤝 User followed');

    return result;
  }

  async unfollowUser(followerId: string, targetUsername: string): Promise<FollowResponseDTO> {
    const targetUser = await this.getTargetUserOrThrow(targetUsername);

    if (followerId === targetUser.id) {
      throw new AppError(400, 'Invalid Action', 'You cannot unfollow yourself.');
    }

    const result = await this.repo.unfollowUser(followerId, targetUser.id);

    logger.info({ followerId, followingId: targetUser.id, targetUsername }, '💔 User unfollowed');

    return result;
  }

  async getFollowers(
    targetUsername: string,
    query: FollowersQueryInput,
    viewerId?: string
  ): Promise<PaginatedResponse<UserSummaryDTO>> {
    const targetUser = await this.getTargetUserOrThrow(targetUsername);

    if (viewerId) {
      const isBlocked = await this.repo.isBlocked(viewerId, targetUser.id);
      if (isBlocked) {
        throw new AppError(404, 'User Not Found', `User '@${targetUsername}' does not exist.`);
      }
    }

    return this.repo.getFollowers(targetUser.id, {
      cursor: query.cursor,
      limit: query.limit,
      search: query.search,
      viewerId,
    });
  }

  async getFollowing(
    targetUsername: string,
    query: FollowersQueryInput,
    viewerId?: string
  ): Promise<PaginatedResponse<UserSummaryDTO>> {
    const targetUser = await this.getTargetUserOrThrow(targetUsername);

    if (viewerId) {
      const isBlocked = await this.repo.isBlocked(viewerId, targetUser.id);
      if (isBlocked) {
        throw new AppError(404, 'User Not Found', `User '@${targetUsername}' does not exist.`);
      }
    }

    return this.repo.getFollowing(targetUser.id, {
      cursor: query.cursor,
      limit: query.limit,
      search: query.search,
      viewerId,
    });
  }

  async blockUser(blockerId: string, targetUsername: string): Promise<void> {
    const targetUser = await this.getTargetUserOrThrow(targetUsername);

    if (blockerId === targetUser.id) {
      throw new AppError(400, 'Invalid Action', 'You cannot block yourself.');
    }

    await this.repo.blockUser(blockerId, targetUser.id);
    logger.info({ blockerId, blockedId: targetUser.id, targetUsername }, '🚫 User blocked');
  }

  async unblockUser(blockerId: string, targetUsername: string): Promise<void> {
    const targetUser = await this.getTargetUserOrThrow(targetUsername);

    if (blockerId === targetUser.id) {
      throw new AppError(400, 'Invalid Action', 'You cannot unblock yourself.');
    }

    await this.repo.unblockUser(blockerId, targetUser.id);
    logger.info({ blockerId, blockedId: targetUser.id, targetUsername }, '✅ User unblocked');
  }

  async muteUser(muterId: string, targetUsername: string): Promise<void> {
    const targetUser = await this.getTargetUserOrThrow(targetUsername);

    if (muterId === targetUser.id) {
      throw new AppError(400, 'Invalid Action', 'You cannot mute yourself.');
    }

    await this.repo.muteUser(muterId, targetUser.id);
    logger.info({ muterId, mutedId: targetUser.id, targetUsername }, '🔇 User muted');
  }

  async unmuteUser(muterId: string, targetUsername: string): Promise<void> {
    const targetUser = await this.getTargetUserOrThrow(targetUsername);

    if (muterId === targetUser.id) {
      throw new AppError(400, 'Invalid Action', 'You cannot unmute yourself.');
    }

    await this.repo.unmuteUser(muterId, targetUser.id);
    logger.info({ muterId, mutedId: targetUser.id, targetUsername }, '🔊 User unmuted');
  }
}

export const socialGraphService = new SocialGraphService();
