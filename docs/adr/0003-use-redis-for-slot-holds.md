# ADR-0003: Use Redis TTL for slot holds

**Date:** 2026-03-16
**Status:** Accepted

---

## Context

OBP needs a mechanism to temporarily reserve a slot while a customer completes the booking form, preventing double-bookings without immediately committing a booking to the database.

## Decision

Use **Redis keys with TTL** to represent slot holds. A hold is a key `hold:{slot_id}` with a configurable expiry (default: 10 minutes). Booking creation checks for the hold and uses optimistic locking on the slot row.

## Rationale

- Redis TTL is atomic — the hold expires automatically without a cleanup job
- Sub-millisecond latency for hold checks
- Redis is already in the stack for caching
- Simple to reason about: hold exists → slot is reserved; key gone → slot is free again

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| DB row with expiry column + cron cleanup | More complex, requires periodic cleanup job, risk of stale locks |
| In-memory (Node.js Map) | Not distributed — fails with multiple server instances |
| PostgreSQL advisory locks | Tied to DB connection lifecycle; harder to set TTL |

## Consequences

### Positive
- Automatic expiry with no cleanup needed
- Works across multiple server instances

### Negative / trade-offs
- Requires Redis as a hard dependency (already present)
- Hold state is lost on Redis restart (acceptable — customers retry)
