# ADR-0002: Use Drizzle ORM for database access

**Date:** 2026-03-16
**Status:** Accepted

---

## Context

The reference server needs a database access layer for PostgreSQL. Options: Drizzle, Prisma, Kysely, raw `pg`/`postgres`.

## Decision

Use **Drizzle ORM** with the `postgres` driver.

## Rationale

- SQL-first: schema defined in TypeScript, full SQL control
- Lightweight — no separate CLI process, no heavyweight runtime
- Excellent TypeScript inference; queries are fully typed
- Migration system built-in (`drizzle-kit`)
- No "magic" — generated SQL is predictable and inspectable

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Prisma | Heavy runtime, Rust binary, slower cold starts, less SQL control |
| Kysely | Good option; Drizzle chosen for schema-first migrations |
| Raw `postgres` | Too much boilerplate for complex booking queries |

## Consequences

### Positive
- Migrations are tracked as TypeScript files, version-controlled
- No N+1 risk — explicit joins required

### Negative / trade-offs
- Smaller ecosystem than Prisma
- Less documentation and community resources
