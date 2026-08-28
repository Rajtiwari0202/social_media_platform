import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { socialGraphService } from '../src/modules/social-graph/social-graph.service.js';
import { signAccessToken } from '../src/utils/jwt.js';
import { prisma } from '../src/lib/prisma.js';
import { AppError } from '../src/middlewares/error.middleware.js';

describe('Social Graph & Relationship REST Endpoints', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    // @ts-expect-error Prisma mock typing
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: '111e4567-e89b-12d3-a456-426614174001',
      tokenVersion: 0,
      deletedAt: null,
    });
  });

  const app = createApp();

  const mockUserPayload = {
    userId: '111e4567-e89b-12d3-a456-426614174001',
    username: 'alice',
    role: 'USER' as const,
    tokenVersion: 0,
  };

  const authToken = signAccessToken(mockUserPayload);

  describe('POST /api/v1/users/:username/follow', () => {
    it('should reject unauthenticated follow requests with 401', async () => {
      const res = await request(app).post('/api/v1/users/bob/follow');
      expect(res.status).toBe(401);
      expect(res.body.title).toBe('Unauthorized');
    });

    it('should successfully follow another user when authenticated', async () => {
      vi.spyOn(socialGraphService, 'followUser').mockResolvedValueOnce({
        isFollowing: true,
        followersCount: 10,
        followingCount: 5,
      });

      const res = await request(app)
        .post('/api/v1/users/bob/follow')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.isFollowing).toBe(true);
      expect(res.body.data.followersCount).toBe(10);
    });

    it('should reject self-follow attempts with 400 Bad Request', async () => {
      const selfToken = signAccessToken({
        userId: '222e4567-e89b-12d3-a456-426614174002',
        username: 'bob',
        role: 'USER' as const,
        tokenVersion: 0,
      });

      vi.spyOn(socialGraphService, 'followUser').mockRejectedValueOnce(
        new AppError(400, 'Invalid Action', 'You cannot follow yourself.')
      );

      const res = await request(app)
        .post('/api/v1/users/bob/follow')
        .set('Authorization', `Bearer ${selfToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/users/:username/follow', () => {
    it('should successfully unfollow a user', async () => {
      vi.spyOn(socialGraphService, 'unfollowUser').mockResolvedValueOnce({
        isFollowing: false,
        followersCount: 9,
        followingCount: 5,
      });

      const res = await request(app)
        .delete('/api/v1/users/bob/follow')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.isFollowing).toBe(false);
      expect(res.body.data.followersCount).toBe(9);
    });
  });

  describe('GET /api/v1/users/:username/followers', () => {
    it('should return paginated list of followers', async () => {
      const mockFollowers = {
        data: [
          {
            id: '333e4567-e89b-12d3-a456-426614174003',
            username: 'charlie',
            displayName: 'Charlie Brown',
            avatarUrl: null,
            bio: 'Developer',
            isVerified: true,
            isFollowing: true,
            isFollowedBy: false,
            followedAt: new Date().toISOString(),
          },
        ],
        pagination: {
          nextCursor: null,
          hasNextPage: false,
          limit: 20,
        },
      };

      vi.spyOn(socialGraphService, 'getFollowers').mockResolvedValueOnce(mockFollowers);

      const res = await request(app).get('/api/v1/users/bob/followers');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].username).toBe('charlie');
    });
  });

  describe('GET /api/v1/users/:username/following', () => {
    it('should return paginated list of followed users', async () => {
      const mockFollowing = {
        data: [
          {
            id: '444e4567-e89b-12d3-a456-426614174004',
            username: 'david',
            displayName: 'David Wilson',
            avatarUrl: null,
            bio: null,
            isVerified: false,
            isFollowing: false,
            isFollowedBy: true,
            followedAt: new Date().toISOString(),
          },
        ],
        pagination: {
          nextCursor: null,
          hasNextPage: false,
          limit: 20,
        },
      };

      vi.spyOn(socialGraphService, 'getFollowing').mockResolvedValueOnce(mockFollowing);

      const res = await request(app).get('/api/v1/users/bob/following');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data[0].username).toBe('david');
    });
  });

  describe('POST & DELETE /api/v1/users/:username/block', () => {
    it('should block a user', async () => {
      vi.spyOn(socialGraphService, 'blockUser').mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/v1/users/bob/block')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('blocked');
    });

    it('should unblock a user', async () => {
      vi.spyOn(socialGraphService, 'unblockUser').mockResolvedValueOnce();

      const res = await request(app)
        .delete('/api/v1/users/bob/block')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('unblocked');
    });
  });

  describe('POST & DELETE /api/v1/users/:username/mute', () => {
    it('should mute a user', async () => {
      vi.spyOn(socialGraphService, 'muteUser').mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/v1/users/bob/mute')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('muted');
    });

    it('should unmute a user', async () => {
      vi.spyOn(socialGraphService, 'unmuteUser').mockResolvedValueOnce();

      const res = await request(app)
        .delete('/api/v1/users/bob/mute')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('unmuted');
    });
  });
});
