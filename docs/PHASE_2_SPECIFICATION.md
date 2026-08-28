# Phase 2: Social Graph, Follower System & Relationship Matrix Specification

## 1. Overview
This specification details the Social Graph API endpoints, composite indexing, anti-harassment block cascades, mute mechanics, and cursor-based pagination formats.

---

## 2. API Endpoints

### 2.1 Follow User
- **Method**: `POST`
- **Path**: `/api/v1/users/:username/follow`
- **Access**: Authenticated (`Authorization: Bearer <token>`)
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "You are now following @raj_tiwari",
    "data": {
      "isFollowing": true,
      "followersCount": 129,
      "followingCount": 45
    }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: When trying to follow self (`followerId === followingId`).
  - `403 Forbidden`: When a block exists between the two users.
  - `404 Not Found`: Target user does not exist.

---

### 2.2 Unfollow User
- **Method**: `DELETE`
- **Path**: `/api/v1/users/:username/follow`
- **Access**: Authenticated
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "You have unfollowed @raj_tiwari",
    "data": {
      "isFollowing": false,
      "followersCount": 128,
      "followingCount": 45
    }
  }
  ```

---

### 2.3 Get Followers (Cursor-Paginated)
- **Method**: `GET`
- **Path**: `/api/v1/users/:username/followers?cursor=<base64>&limit=20&search=alice`
- **Access**: Public / Optional Authenticated (Hydrates `isFollowing` / `isFollowedBy` if logged in)
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "uuid-v4",
        "username": "alice_dev",
        "displayName": "Alice Smith",
        "avatarUrl": "https://...",
        "bio": "Full-stack engineer",
        "isVerified": true,
        "isFollowing": false,
        "isFollowedBy": true,
        "followedAt": "2026-08-28T12:00:00.000Z"
      }
    ],
    "pagination": {
      "nextCursor": "MjAyNi0wOC0yOFQxMjowMDowMC4wMDBa",
      "hasNextPage": true,
      "limit": 20
    }
  }
  ```

---

### 2.4 Get Following (Cursor-Paginated)
- **Method**: `GET`
- **Path**: `/api/v1/users/:username/following?cursor=<base64>&limit=20`
- **Access**: Public / Optional Authenticated

---

### 2.5 Block & Unblock User
- **Method**: `POST /api/v1/users/:username/block`
  - Atomically creates `Block` relation.
  - Automatically severs bidirectional follow relations and decrements respective profile counters.
- **Method**: `DELETE /api/v1/users/:username/block`

---

### 2.6 Mute & Unmute User
- **Method**: `POST /api/v1/users/:username/mute`
- **Method**: `DELETE /api/v1/users/:username/mute`
