# ADR 0003: Direct-to-Storage Media Uploads via Presigned URLs

## Status
**Accepted** (2026-08-27)

## Context
High-resolution images and videos create high network I/O and memory pressure if routed through application API servers (multipart multipart form data parsing, memory buffering, Node.js event loop blocks).

## Decision
1. **Presigned Upload URLs**: The client requests a presigned `PUT` URL from `/api/v1/media/presigned-url` with authenticated metadata (MIME type, content size).
2. **Direct Storage Upload**: The client uploads the binary payload directly to MinIO (dev) or AWS S3 (production).
3. **Background Image Optimization**: Upon post submission, background workers use **Sharp** to generate compressed WebP variants and responsive thumbnails.

## Consequences
- Backend web servers remain lightweight and never buffer multi-megabyte binary payloads.
- High scalability under heavy concurrent media uploads.
