# Production-Grade Social Media Platform: API Specification

## 1. Global API Standards

- **Base URL**: `https://api.socialplatform.com/api/v1` (Dev: `http://localhost:5000/api/v1`)
- **Content-Type**: `application/json; charset=utf-8`
- **Authentication**: `Authorization: Bearer <JWT_ACCESS_TOKEN>` or Secure `HttpOnly` cookie.
- **Cursor-Based Pagination Standard**:
  ```json
  {
    "data": [ ... ],
    "pagination": {
      "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA4LTI3VDIzOjAwOjAwWiIsImlkIjoiMTIzIn0=",
      "hasNextPage": true,
      "limit": 20
    }
  }
  ```
- **Error Format (RFC 7807 Compliant)**:
  ```json
  {
    "type": "https://api.socialplatform.com/errors/validation-failed",
    "title": "Validation Error",
    "status": 422,
    "detail": "Invalid handle format. Usernames must be 3-30 alphanumeric characters.",
    "instance": "/api/v1/users/profile",
    "invalidParams": [
      { "name": "username", "reason": "Must contain only letters, numbers, and underscores." }
    ],
    "timestamp": "2026-08-27T23:15:00.000Z"
  }
  ```

---

## 2. API Endpoint Matrix

### 2.1 Authentication & Session Management (`/api/v1/auth`)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new account (email, username, password) | Public |
| `POST` | `/auth/login` | Authenticate with email/username & password | Public |
| `POST` | `/auth/refresh` | Exchange refresh token for new access & refresh token | Public (Cookie) |
| `POST` | `/auth/logout` | Invalidate current session and clear cookies | Authenticated |
| `POST` | `/auth/logout-all` | Invalidate all active sessions (increments tokenVersion) | Authenticated |
| `GET` | `/auth/me` | Fetch authenticated user's session profile & permissions | Authenticated |

---

### 2.2 Users & Profiles (`/api/v1/users`)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/:username` | Retrieve public profile by username | Public |
| `PATCH` | `/users/profile` | Update profile (display name, bio, location, website) | Authenticated |
| `POST` | `/users/:username/follow` | Follow a user | Authenticated |
| `DELETE`| `/users/:username/follow` | Unfollow a user | Authenticated |
| `GET` | `/users/:username/followers` | Paginated list of followers | Public |
| `GET` | `/users/:username/following` | Paginated list of users being followed | Public |
| `POST` | `/users/:username/block` | Block a user | Authenticated |
| `DELETE`| `/users/:username/block` | Unblock a user | Authenticated |

---

### 2.3 Posts & Content (`/api/v1/posts`)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/posts` | Create a new post (text, mediaKeys, replyToId) | Authenticated |
| `GET` | `/posts/:id` | Get single post details with media and author | Public |
| `DELETE`| `/posts/:id` | Soft delete a post | Author/Admin |
| `POST` | `/posts/:id/like` | Like a post | Authenticated |
| `DELETE`| `/posts/:id/like` | Unlike a post | Authenticated |
| `POST` | `/posts/:id/bookmark` | Bookmark a post | Authenticated |
| `DELETE`| `/posts/:id/bookmark` | Remove bookmark | Authenticated |
| `POST` | `/posts/:id/repost` | Repost / Quote a post | Authenticated |
| `GET` | `/posts/:id/comments` | Fetch threaded comments for post | Public |
| `POST` | `/posts/:id/comments` | Post a comment or reply to comment | Authenticated |

---

### 2.4 Feed Generation (`/api/v1/feed`)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/feed/timeline` | Personalized following feed (hybrid fan-out) | Authenticated |
| `GET` | `/feed/for-you` | Algorithmic exploration feed | Public/Auth |
| `GET` | `/feed/user/:username` | User specific post timeline | Public |

---

### 2.5 Media Upload Direct Pipeline (`/api/v1/media`)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/media/presigned-url` | Generate S3/MinIO presigned upload URL & metadata | Authenticated |
| `POST` | `/media/confirm` | Confirm upload completion and trigger Sharp optimization | Authenticated |

---

### 2.6 Notifications & Messaging (`/api/v1/notifications` & `/api/v1/chat`)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Get paginated notification list | Authenticated |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read | Authenticated |
| `GET` | `/chat/rooms` | List active direct/group chat conversations | Authenticated |
| `POST` | `/chat/rooms` | Create or fetch 1:1 direct room | Authenticated |
| `GET` | `/chat/rooms/:roomId/messages` | Paginated message history for room | Authenticated |
| `POST` | `/chat/rooms/:roomId/messages` | Send message to room | Authenticated |
