# ADR 0001: Monorepo Architecture & Technology Stack Selection

## Status
**Accepted** (2026-08-27)

## Context
We require an engineering architecture for an enterprise-grade social media platform that balances developer velocity, type safety, modular decoupling, and long-term scalability.

## Decision
1. **Monorepo Structure**: Utilize npm workspaces (`packages/*`, `apps/*`) to allow atomic cross-tier commits, shared domain validation schemas (Zod), and consistent build orchestration.
2. **Frontend Framework**: Next.js 15 (App Router) + React 19 + Tailwind CSS + Lucide Icons + TanStack Query.
3. **Backend Service**: Node.js 22 LTS with TypeScript in a Domain-Driven Clean Architecture with Express, Prisma ORM, and BullMQ.
4. **Data Stores**:
   - **PostgreSQL 16**: Primary source of truth for all relational user data, posts, comments, and indexes.
   - **Redis 7**: High-performance in-memory cache for feed timelines, rate limiting, and Socket.io cluster pub/sub.
   - **MinIO / AWS S3**: High-throughput blob storage for user avatars, banners, and post media.

## Consequences
### Positive:
- End-to-end TypeScript type sharing ensures zero API contract mismatch between frontend forms and backend controllers.
- Single Git repository enables unified issue tracking, atomic PRs, and unified CI/CD pipelines.
- Standard Docker compose brings up the entire infrastructure locally in a single command.

### Mitigations:
- Workspaces are strictly decoupled via `packages/shared` to prevent circular dependencies.
