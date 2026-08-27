# ADR 0002: Hybrid Feed Fan-Out Architecture

## Status
**Accepted** (2026-08-27)

## Context
Feed generation is the most critical and latency-sensitive path in a social media platform.
- **Pure Fan-Out on Write (Push)** provides $\mathcal{O}(1)$ read latency by pushing new posts to all follower inboxes. However, for "celebrity" accounts with millions of followers, a single post triggers massive write amplification, background queue congestion, and high Redis memory overhead.
- **Pure Fan-Out on Read (Pull)** avoids write amplification but makes every user feed load expensive ($\mathcal{O}(N)$ database queries and sorting across all followed users).

## Decision
We implement a **Hybrid Fan-Out Architecture**:
1. **Followers $< 25,000$ (Standard Users)**: Fan-out on write into Redis Sorted Sets (`feed:user:{id}`) via asynchronous BullMQ workers.
2. **Followers $\ge 25,000$ (High-profile accounts)**: Fan-out on read. Celebrity posts are queried dynamically at request time and merged into the user's cached timeline.
3. **Redis Cap**: User timeline sorted sets in Redis are capped at 800 recent post IDs (`ZREMRANGEBYRANK`) with 30-day TTLs for active users.

## Consequences
- Fast timeline retrieval ($< 30\text{ms}$) for 99.9% of feed reads.
- Total immunity against celebrity write amplification spikes.
- Bounded Redis memory consumption.
