import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { usersService } from '../src/modules/users/users.service.js';

describe('Authentication & User Profile REST Endpoints', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  const app = createApp();

  describe('GET /health', () => {
    it('should return 200 healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.version).toBe('0.1.0');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should validate request schema and reject invalid payloads', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email-format',
          username: 'ab', // too short
          displayName: '',
          password: 'weak',
        });

      expect(res.status).toBe(422);
      expect(res.body.title).toBe('Validation Error');
      expect(res.body.invalidParams).toBeDefined();
      expect(res.body.invalidParams.length).toBeGreaterThan(0);
    });

    it('should successfully register user when given valid inputs', async () => {
      const mockUserDTO = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'raj@example.com',
        username: 'raj_tiwari',
        role: 'USER' as const,
        isVerified: false,
        isPrivate: false,
        createdAt: new Date().toISOString(),
        profile: {
          id: '223e4567-e89b-12d3-a456-426614174001',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          displayName: 'Raj Tiwari',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      vi.spyOn(authService, 'register').mockResolvedValueOnce({
        user: mockUserDTO,
        accessToken: 'mock_jwt_access_token',
        refreshToken: 'mock_raw_refresh_token_64chars',
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'raj@example.com',
          username: 'raj_tiwari',
          displayName: 'Raj Tiwari',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.username).toBe('raj_tiwari');
      expect(res.body.data.accessToken).toBe('mock_jwt_access_token');
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully authenticate user with identifier and password', async () => {
      const mockUserDTO = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'raj@example.com',
        username: 'raj_tiwari',
        role: 'USER' as const,
        isVerified: true,
        isPrivate: false,
        createdAt: new Date().toISOString(),
        profile: {
          id: '223e4567-e89b-12d3-a456-426614174001',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          displayName: 'Raj Tiwari',
          followersCount: 50,
          followingCount: 20,
          postsCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      vi.spyOn(authService, 'login').mockResolvedValueOnce({
        user: mockUserDTO,
        accessToken: 'mock_jwt_access_token_login',
        refreshToken: 'mock_raw_refresh_token_64chars_login',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'raj_tiwari',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('raj@example.com');
      expect(res.body.data.accessToken).toBe('mock_jwt_access_token_login');
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate tokens and return new access token', async () => {
      vi.spyOn(authService, 'refreshTokens').mockResolvedValueOnce({
        accessToken: 'mock_new_access_token',
        refreshToken: 'mock_new_refresh_token',
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['refreshToken=mock_old_refresh_token']);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.accessToken).toBe('mock_new_access_token');
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear cookies on logout', async () => {
      vi.spyOn(authService, 'logout').mockResolvedValueOnce();

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', ['refreshToken=mock_token_to_logout']);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully.');
    });
  });

  describe('GET /api/v1/users/:username', () => {
    it('should return public profile for existing username', async () => {
      const mockProfile = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        username: 'raj_tiwari',
        displayName: 'Raj Tiwari',
        bio: 'Building systems.',
        followersCount: 10,
        followingCount: 5,
        postsCount: 2,
        isVerified: true,
        isPrivate: false,
        isFollowing: false,
        isFollowedBy: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.spyOn(usersService, 'getProfileByUsername').mockResolvedValueOnce(mockProfile);

      const res = await request(app).get('/api/v1/users/raj_tiwari');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.username).toBe('raj_tiwari');
      expect(res.body.data.displayName).toBe('Raj Tiwari');
      expect(res.body.data.followersCount).toBe(10);
    });
  });
});
