# The Engineering Journey: Building a Production-Grade Social Media Platform

## Introduction
This living document serves as our comprehensive technical journal, architectural changelog, and engineering record. It captures every design decision, trade-off, security mechanism, and scalability consideration made during the evolution of this platform.

---

## 📅 Milestones & Evolution

### [Phase 0] Foundation, Monorepo Scaffolding & DevOps
- **Date**: 2026-08-27
- **Commit**: `016166e` (`feat(core): initialize enterprise monorepo, docker infrastructure, and architecture documentation`)
- **Key Accomplishments**:
  - Established npm workspaces monorepo structure separating `@social/shared` (types & Zod contracts), `@social/api` (Node.js Express backend), and `@social/web` (Next.js 15 App Router frontend).
  - Orchestrated multi-container local infrastructure with Docker Compose (PostgreSQL 16, Redis 7, MinIO S3 object store, MailHog SMTP).
  - Authored foundational Architecture Decision Records (ADRs):
    - `ADR 0001`: Monorepo Architecture & Technology Stack Selection.
    - `ADR 0002`: Hybrid Feed Fan-Out Architecture (Push for standard users, Pull for accounts $> 25\text{k}$ followers).
    - `ADR 0003`: Direct-to-Storage Media Upload Pipeline using S3 Presigned URLs.
  - Implemented CI/CD pipeline using GitHub Actions (`.github/workflows/ci.yml`).

---

### [Phase 1] Identity, Authentication, Authorization & User Profile Subsystem
- **Date**: 2026-08-28
- **Core Problem Statement**: Generic authentication implementations frequently suffer from token theft vulnerability, lack of session revocation, insecure storage, and brute-force vulnerability. We require an enterprise-grade identity layer with zero-compromise security.
- **Key Engineering Decisions**:
  1. **Password Hashing Algorithm**: Selected **Argon2id** over bcrypt/PBKDF2. Argon2id provides memory-hardness resistant to GPU/ASIC parallel cracking (configured with memoryCost: 64MB, timeCost: 3 iterations, parallelism: 4).
  2. **Token Security Model**:
     - **Access Token**: Short-lived (15 minutes) stateless JWT carrying `sub` (userId), `username`, `role`, and `tokenVersion`.
     - **Refresh Token**: Cryptographically random 64-character token stored **hashed with SHA-256** in PostgreSQL. Raw token is delivered to the browser exclusively through an `HttpOnly`, `SameSite=Strict`, `Secure` cookie, preventing XSS access.
  3. **Refresh Token Rotation & Compromise Detection**:
     - Upon every refresh request, the existing refresh token is invalidated and a new pair is issued.
     - If a previously used or invalid refresh token is submitted, the system triggers a **Security Compromise Alert**: it immediately revokes ALL active sessions for that user by incrementing `user.tokenVersion` and purging all stored refresh tokens.
  4. **Instant Revocation via `tokenVersion`**:
     - Stored on the user record in PostgreSQL and validated during authenticated requests. When a user changes their password or clicks "Log Out All Devices", `tokenVersion` is incremented, immediately invalidating all active JWTs without requiring a heavy blacklist lookup.
  5. **Brute Force Protection**:
     - Integrated Redis-backed sliding window rate limiter on `/api/v1/auth/login` (5 attempts per 15 minutes per IP/identifier) and `/api/v1/auth/register` (3 accounts per hour).
  6. **User Profile Architecture**:
     - Automated 1-to-1 profile creation on registration with unique handle constraint (`@username`).
     - Fast public profile lookup (`GET /api/v1/users/:username`) with follower/following/post counters.
     - Profile editing (`PATCH /api/v1/users/profile`) with Zod schema validation.

### [Phase 2] Social Graph, Follower System & Relationship Matrix
- **Date**: 2026-08-28
- **Core Problem Statement**: Social networks demand instant follow graph operations with zero read/write degradation as graph edges grow into millions of records. Furthermore, anti-harassment mechanisms (blocking & muting) must be rigorously enforced at database and API levels to prevent unauthorized data exposure.
- **Key Engineering Decisions**:
  1. **Composite Primary Keys & Indexing Strategy**:
     - The `follows` table uses composite primary key `(follower_id, following_id)` for $\mathcal{O}(1)$ relation lookups and idempotency.
     - Dual composite indexes `idx_follows_following_id (following_id, created_at DESC)` and `idx_follows_follower_id (follower_id, created_at DESC)` ensure cursor-based pagination executes in sub-10ms without table scans.
  2. **Transactional Counter Maintenance**:
     - Followers and Following counts are cached directly on `Profile` records and maintained using atomic Prisma transaction batch operations (`increment: 1`, `decrement: 1`), removing the need for expensive `COUNT(*)` queries on profile views.
  3. **Bidirectional Block Cascade & Strict Privacy Isolation**:
     - When user A blocks user B:
       - Follow connections in **both directions** are automatically severed within the same transaction, and profile counters are cleanly decremented.
       - Query-level filtering: if user A and user B have a block relation, querying either profile returns `404 User Not Found` (strict privacy protection).
  4. **Cursor-Based Pagination Standard**:
     - Follower and following lists return base64-encoded timestamp cursors (`createdAt`), preventing duplicate items or missed items caused by offset-drift when users follow/unfollow in real-time.
  5. **Optimistic UI with Instant State Reflection**:
     - Built React `<FollowButton />` component with instant optimistic feedback, hover-to-unfollow transitions, and error rollback.
     - Implemented `<UsersListModal />` displaying followers/following lists with real-time client search and inline follow toggles.

---

## 🔒 Security Architecture Reference

| Threat Vector | Mitigation Strategy |
| :--- | :--- |
| **XSS Token Exfiltration** | Refresh tokens reside exclusively in `HttpOnly`, `SameSite=Strict` cookies. JavaScript cannot access them. |
| **Brute Force & Credential Stuffing** | Redis sliding window rate limiter + Argon2id computational resistance. |
| **Stolen Refresh Token Reuse** | Single-use rotation with automated family revocation on reuse detection. |
| **Stale Session After Password Change** | Incrementing `tokenVersion` renders existing JWTs instantly invalid across all microservices/gateways. |
| **Input Injection & Parameter Tampering** | Strict runtime schema parsing using **Zod** on body, query, and params prior to business logic execution. |
| **SQL Injection** | Parameterized queries and type-safe query generation via **Prisma ORM**. |
