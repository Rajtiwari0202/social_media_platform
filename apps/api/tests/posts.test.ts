import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { postsService } from '../src/modules/posts/posts.service.js';
import { mediaService } from '../src/modules/media/media.service.js';
import { signAccessToken } from '../src/utils/jwt.js';
import { prisma } from '../src/lib/prisma.js';
import { PostDTO } from '@social/shared';

describe('Posts, Media & Interactive Threads REST Endpoints', () => {
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
    username: 'raj_tiwari',
    role: 'USER' as const,
    tokenVersion: 0,
  };

  const authToken = signAccessToken(mockUserPayload);

  const mockPost: PostDTO = {
    id: '999e4567-e89b-12d3-a456-426614174099',
    authorId: mockUserPayload.userId,
    author: {
      id: mockUserPayload.userId,
      username: 'raj_tiwari',
      displayName: 'Raj Tiwari',
      avatarUrl: null,
      isVerified: true,
    },
    content: 'Building an enterprise social media platform! #TypeScript',
    replyToId: null,
    repostOfId: null,
    repostOf: null,
    media: [
      {
        id: 'med-1',
        mediaUrl: 'http://localhost:9000/media/sample.jpg',
        thumbnailUrl: null,
        mediaType: 'IMAGE',
        fileSize: 102400,
        width: 1200,
        height: 800,
        orderIndex: 0,
      },
    ],
    likesCount: 15,
    commentsCount: 3,
    repostsCount: 2,
    bookmarksCount: 4,
    hasLiked: false,
    hasBookmarked: false,
    hasReposted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('POST /api/v1/posts', () => {
    it('should reject unauthenticated post creation with 401', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .send({ content: 'Hello world' });

      expect(res.status).toBe(401);
    });

    it('should reject empty post creation with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' });

      expect(res.status).toBe(422);
      expect(res.body.title).toBe('Validation Error');
    });

    it('should create a valid post with media attachments when authenticated', async () => {
      vi.spyOn(postsService, 'createPost').mockResolvedValueOnce(mockPost);

      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Building an enterprise social media platform! #TypeScript',
          media: mockPost.media,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(mockPost.id);
      expect(res.body.data.content).toContain('#TypeScript');
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    it('should return a single post by ID', async () => {
      vi.spyOn(postsService, 'getPostById').mockResolvedValueOnce(mockPost);

      const res = await request(app).get(`/api/v1/posts/${mockPost.id}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(mockPost.id);
    });
  });

  describe('GET /api/v1/posts (Feed)', () => {
    it('should return paginated post feed', async () => {
      vi.spyOn(postsService, 'getFeed').mockResolvedValueOnce({
        data: [mockPost],
        pagination: {
          nextCursor: null,
          hasNextPage: false,
          limit: 20,
        },
      });

      const res = await request(app).get('/api/v1/posts?limit=20');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    it('should delete post when authenticated as author', async () => {
      vi.spyOn(postsService, 'deletePost').mockResolvedValueOnce();

      const res = await request(app)
        .delete(`/api/v1/posts/${mockPost.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });
  });

  describe('Reactions: POST /api/v1/posts/:id/like, bookmark, repost', () => {
    it('should toggle like on a post', async () => {
      vi.spyOn(postsService, 'toggleLike').mockResolvedValueOnce({
        postId: mockPost.id,
        hasLiked: true,
        likesCount: 16,
        bookmarksCount: 4,
        repostsCount: 2,
      });

      const res = await request(app)
        .post(`/api/v1/posts/${mockPost.id}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hasLiked).toBe(true);
      expect(res.body.data.likesCount).toBe(16);
    });

    it('should toggle bookmark on a post', async () => {
      vi.spyOn(postsService, 'toggleBookmark').mockResolvedValueOnce({
        postId: mockPost.id,
        hasBookmarked: true,
        likesCount: 15,
        bookmarksCount: 5,
        repostsCount: 2,
      });

      const res = await request(app)
        .post(`/api/v1/posts/${mockPost.id}/bookmark`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hasBookmarked).toBe(true);
      expect(res.body.data.bookmarksCount).toBe(5);
    });

    it('should toggle repost on a post', async () => {
      vi.spyOn(postsService, 'toggleRepost').mockResolvedValueOnce({
        postId: mockPost.id,
        hasReposted: true,
        likesCount: 15,
        bookmarksCount: 4,
        repostsCount: 3,
      });

      const res = await request(app)
        .post(`/api/v1/posts/${mockPost.id}/repost`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hasReposted).toBe(true);
      expect(res.body.data.repostsCount).toBe(3);
    });
  });

  describe('Comments: POST & GET /api/v1/posts/:id/comments', () => {
    it('should create a comment on a post', async () => {
      const mockComment = {
        id: 'comm-1',
        postId: mockPost.id,
        authorId: mockUserPayload.userId,
        author: {
          id: mockUserPayload.userId,
          username: 'raj_tiwari',
          displayName: 'Raj Tiwari',
          avatarUrl: null,
        },
        parentId: null,
        content: 'Great initiative!',
        likesCount: 0,
        hasLiked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.spyOn(postsService, 'createComment').mockResolvedValueOnce(mockComment);

      const res = await request(app)
        .post(`/api/v1/posts/${mockPost.id}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Great initiative!' });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Great initiative!');
    });

    it('should retrieve threaded comments for a post', async () => {
      vi.spyOn(postsService, 'getPostComments').mockResolvedValueOnce([
        {
          id: 'comm-1',
          postId: mockPost.id,
          authorId: mockUserPayload.userId,
          author: {
            id: mockUserPayload.userId,
            username: 'raj_tiwari',
            displayName: 'Raj Tiwari',
            avatarUrl: null,
          },
          parentId: null,
          content: 'Root comment',
          likesCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          repliesCount: 1,
          replies: [
            {
              id: 'reply-1',
              postId: mockPost.id,
              authorId: '222e4567-e89b-12d3-a456-426614174002',
              author: {
                id: '222e4567-e89b-12d3-a456-426614174002',
                username: 'alice',
                displayName: 'Alice',
                avatarUrl: null,
              },
              parentId: 'comm-1',
              content: 'Nested reply',
              likesCount: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      ]);

      const res = await request(app).get(`/api/v1/posts/${mockPost.id}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].replies).toHaveLength(1);
      expect(res.body.data[0].replies[0].content).toBe('Nested reply');
    });
  });

  describe('Media: POST /api/v1/media/presigned-url', () => {
    it('should generate a presigned upload URL for valid image input', async () => {
      vi.spyOn(mediaService, 'createPresignedUploadUrl').mockResolvedValueOnce({
        uploadUrl: 'http://localhost:9000/social-media-media/uploads/mock-key?sig=123',
        mediaKey: 'uploads/user/mock-key.jpg',
        publicUrl: 'http://localhost:9000/social-media-media/uploads/user/mock-key.jpg',
        expiresIn: 300,
      });

      const res = await request(app)
        .post('/api/v1/media/presigned-url')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileName: 'profile.jpg',
          fileType: 'image/jpeg',
          fileSize: 1048576,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.uploadUrl).toContain('http://localhost:9000');
    });
  });
});
