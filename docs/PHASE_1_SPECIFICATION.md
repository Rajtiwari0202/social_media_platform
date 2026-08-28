# Phase 1: Authentication & User Profile Specification

## 1. Overview
This specification details the endpoints, authentication headers, cookies, schemas, and behavior for the Authentication, Authorization, and User Profile Subsystem.

---

## 2. Authentication Endpoints

### 2.1 Register User
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Access**: Public (Rate Limited: 3 req / hr / IP)
- **Request Body**:
  ```json
  {
    "email": "developer@example.com",
    "username": "raj_tiwari",
    "displayName": "Raj Tiwari",
    "password": "SecurePassword123"
  }
  ```
- **Success Response (201 Created)**:
  - **Set-Cookie**: `refreshToken=<token>; HttpOnly; Path=/api/v1/auth; SameSite=Strict; Max-Age=604800`
  - **Body**:
    ```json
    {
      "status": "success",
      "data": {
        "user": {
          "id": "uuid-v4",
          "email": "developer@example.com",
          "username": "raj_tiwari",
          "role": "USER",
          "isVerified": false,
          "isPrivate": false,
          "createdAt": "2026-08-28T00:00:00.000Z",
          "profile": {
            "id": "uuid-v4",
            "displayName": "Raj Tiwari",
            "bio": null,
            "avatarUrl": null,
            "bannerUrl": null,
            "followersCount": 0,
            "followingCount": 0,
            "postsCount": 0
          }
        },
        "accessToken": "eyJhbGciOi..."
      }
    }
    ```

---

### 2.2 Login User
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Access**: Public (Rate Limited: 5 req / 15 min / IP)
- **Request Body**:
  ```json
  {
    "identifier": "raj_tiwari",
    "password": "SecurePassword123"
  }
  ```
- **Success Response (200 OK)**:
  - **Set-Cookie**: `refreshToken=<token>; HttpOnly; Path=/api/v1/auth; SameSite=Strict; Max-Age=604800`
  - **Body**: Same envelope as Register.

---

### 2.3 Refresh Access Token
- **Method**: `POST`
- **Path**: `/api/v1/auth/refresh`
- **Access**: Public (Requires `refreshToken` in Cookie or Body)
- **Success Response (200 OK)**:
  - **Set-Cookie**: `refreshToken=<new-rotated-token>; HttpOnly; Path=/api/v1/auth; SameSite=Strict; Max-Age=604800`
  - **Body**:
    ```json
    {
      "status": "success",
      "data": {
        "accessToken": "eyJhbGciOi..."
      }
    }
    ```

---

### 2.4 Logout & Logout All
- **Method**: `POST /api/v1/auth/logout`: Clears cookie and deletes current refresh token.
- **Method**: `POST /api/v1/auth/logout-all`: Invalids all sessions across devices by incrementing `tokenVersion`.

---

## 3. User & Profile Endpoints

### 3.1 Get Public Profile
- **Method**: `GET`
- **Path**: `/api/v1/users/:username`
- **Access**: Public
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "uuid-v4",
      "userId": "uuid-v4",
      "username": "raj_tiwari",
      "displayName": "Raj Tiwari",
      "bio": "Building scalable systems.",
      "avatarUrl": "https://...",
      "bannerUrl": "https://...",
      "location": "San Francisco, CA",
      "website": "https://rajtiwari.dev",
      "followersCount": 128,
      "followingCount": 45,
      "postsCount": 32,
      "isFollowing": false,
      "createdAt": "2026-08-28T00:00:00.000Z"
    }
  }
  ```

---

### 3.2 Update User Profile
- **Method**: `PATCH`
- **Path**: `/api/v1/users/profile`
- **Access**: Authenticated (Requires `Authorization: Bearer <accessToken>`)
- **Request Body**:
  ```json
  {
    "displayName": "Raj Tiwari (Building)",
    "bio": "Building production-grade social platforms.",
    "location": "Global",
    "website": "https://github.com/Rajtiwari0202"
  }
  ```
