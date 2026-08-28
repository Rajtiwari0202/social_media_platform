# Phase 3: Content Creation, Rich Media Pipeline & Interactive Threads Specification

## 1. Overview
This specification details the Posts CRUD, direct-to-S3/MinIO presigned upload pipeline, atomic reactions (Likes, Bookmarks, Reposts), hashtag/mention extraction, and nested threaded comments.

---

## 2. API Endpoints

### 2.1 Presigned Upload URL (`/api/v1/media/presigned-url`)
- **Method**: `POST`
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "fileName": "photo.jpg",
    "fileType": "image/jpeg",
    "fileSize": 2048576
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "uploadUrl": "http://localhost:9000/social-media-media/uploads/user-id/1720000000-abcd.jpg?X-Amz-Signature=...",
      "mediaKey": "uploads/user-id/1720000000-abcd.jpg",
      "publicUrl": "http://localhost:9000/social-media-media/uploads/user-id/1720000000-abcd.jpg",
      "expiresIn": 300
    }
  }
  ```

---

### 2.2 Create Post (`POST /api/v1/posts`)
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "content": "Exploring the new platform architecture! #TypeScript @raj_tiwari",
    "media": [
      {
        "mediaUrl": "http://localhost:9000/social-media-media/uploads/...",
        "mediaType": "IMAGE",
        "fileSize": 2048576,
        "orderIndex": 0
      }
    ]
  }
  ```
- **Success Response (201 Created)**: Returns created `PostDTO`.

---

### 2.3 Post Interactions
- **Like Post**: `POST /api/v1/posts/:id/like` (Atomically toggles like status and increments/decrements `likesCount`).
- **Bookmark Post**: `POST /api/v1/posts/:id/bookmark` (Toggles bookmark and maintains `bookmarksCount`).
- **Repost Post**: `POST /api/v1/posts/:id/repost` (Toggles repost and maintains `repostsCount`).

---

### 2.4 Threaded Comments
- **Create Comment**: `POST /api/v1/posts/:id/comments`
  ```json
  {
    "content": "Awesome architecture!",
    "parentId": null
  }
  ```
- **Get Comments Tree**: `GET /api/v1/posts/:id/comments` (Returns root comments with nested `replies` array).
