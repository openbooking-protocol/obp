# Roadmap — OpenBooking Protocol

> Last updated: 2026-03-16

---

## Phase 0 — Project setup `[19/23]` ← current

Infrastructure and tooling needed before substantive development begins.

- [x] Repository structure (monorepo)
- [x] Server stack (Node.js + TypeScript + Fastify + Drizzle + Redis)
- [x] Frontend stack (Next.js 14 + Tailwind + shadcn/ui)
- [x] OpenAPI tooling (Spectral + Redocly)
- [x] Testing (Vitest + Playwright)
- [x] Docs (VitePress)
- [x] Docker (multi-stage Dockerfiles + docker-compose)
- [ ] Project Charter, Glossary, ADRs, ROADMAP
- [ ] CI/CD finalization

---

## Phase 1 — Protocol specification `[0/67]`

The normative specification. Nothing in Phase 2+ is built before this is done.

**Key deliverables:**
- Core entity schemas: Provider, Service, Resource, Slot, Booking, Schedule
- OpenAPI 3.1 YAML covering all endpoints
- Federation protocol spec (WebFinger, HTTP Signatures, JSON-LD messages)
- Security model
- Markdown spec documents in `spec/`

**Exit criteria:** Spec peer-reviewed and frozen.

---

## Phase 2 — Reference server `[0/96]`

A fully functional OBP server — the canonical implementation of the spec.

**Key deliverables:**
- All API endpoints implemented (providers, services, resources, slots, bookings, webhooks)
- Auth: API keys + OAuth2 + PKCE + RBAC
- Federation: WebFinger, HTTP Signatures, federated search/book/cancel/sync
- CalDAV / iCal integration
- Email notifications
- Unit + integration + load tests
- Docker-ready

**Exit criteria:** All tests pass, k6 load test meets targets, runs in Docker.

---

## Phase 3 — Reference frontend `[0/53]`

A Next.js application that demonstrates a complete end-user and provider experience.

**Key deliverables:**
- Public booking UI (search → slot picker → booking flow)
- Federated search across servers
- Provider dashboard (services, schedule, bookings, analytics)
- Admin panel
- Accessibility (WCAG 2.1 AA), i18n (EN + SR)
- Playwright e2e tests for full booking flow

**Exit criteria:** Complete booking flow works end-to-end, e2e tests pass.

---

## Phase 4 — SDK, docs, finalization `[0/49]`

Polish, tooling, and community readiness.

**Key deliverables:**
- `@obp/client` — TypeScript SDK (generated from OpenAPI)
- `obp-client` — Python SDK
- Validator CLI — compliance checker for OBP implementations
- `create-obp-server` — scaffold CLI
- VitePress docs site with full API reference and tutorials
- Demo: two federated OBP servers running live
- NLnet grant proposal submitted

**Exit criteria:** Demo live, npm + PyPI packages published, NLnet proposal submitted.

---

## Version milestones

| Version | Contents | Target |
|---------|----------|--------|
| `v0.1-spec` | Protocol specification frozen | 2026 Q2 |
| `v0.1-server` | Reference server, all endpoints | 2026 Q2 |
| `v0.1-frontend` | Reference frontend, booking flow | 2026 Q3 |
| `v0.1.0` | Full release: SDK + docs + demo | 2026 Q3 |

---

## Future (post-v0.1)

These are explicitly out of scope for v0.1 but tracked for future versions:

- **Payment extension** — OBP-Pay: standardized payment step in booking flow
- **Video conferencing integration** — attach a meeting link to a booking
- **Mobile SDKs** — iOS (Swift) and Android (Kotlin)
- **Recurring bookings** — book a weekly slot
- **Group bookings** — multiple participants per slot
- **Waitlist** — automatic waitlist when a slot is fully booked
- **Review system** — post-booking customer ratings
