# ADR-0001: Use Fastify for the reference server

**Date:** 2026-03-16
**Status:** Accepted
**Deciders:** Protocol author

---

## Context

The reference server needs a Node.js HTTP framework. The primary candidates are Express, Fastify, Hono, and Elysia.

## Decision

Use **Fastify v4** as the HTTP framework.

## Rationale

- Significantly faster than Express in benchmarks (2–4×)
- First-class TypeScript support with typed routes and schemas
- Built-in JSON schema validation (via Ajv) that integrates with Zod
- Plugin ecosystem covers CORS, rate limiting, Swagger — all required by OBP
- Mature, well-maintained, production-proven

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Express | Slower, no built-in TypeScript, requires many plugins for basic functionality |
| Hono | Excellent but smaller ecosystem; less proven at scale |
| Elysia | Bun-first; adds Bun runtime dependency |

## Consequences

### Positive
- High throughput matters for slot queries (can receive many concurrent requests)
- Type-safe routes reduce runtime errors

### Negative / trade-offs
- Fastify's plugin system has a steeper learning curve than Express
- Schema validation adds boilerplate (acceptable: OBP already defines schemas via OpenAPI)
