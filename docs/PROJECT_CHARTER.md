# Project Charter — OpenBooking Protocol (OBP)

**Version:** 1.0
**Date:** 2026-03-16
**Status:** Active

---

## 1. Project Overview

OpenBooking Protocol (OBP) is an open, federated protocol for scheduling and booking services across the web. It defines a standard HTTP API that any provider (barber shop, medical clinic, sports facility, etc.) can implement, and a federation layer that allows independent servers to discover each other and exchange bookings without a central authority.

OBP is to booking what ActivityPub is to social networking: a common language that breaks down walled gardens.

---

## 2. Problem Statement

Today's appointment booking landscape is fragmented:

- **Provider lock-in** — businesses are forced onto centralized platforms (Calendly, Fresha, Booksy) that own the customer relationship and charge rent on every booking.
- **No interoperability** — a customer using Platform A cannot book a service on Platform B without creating a new account.
- **No self-hosting** — businesses cannot run their own infrastructure without losing discoverability.
- **Proprietary APIs** — each platform exposes a different API; developers must integrate with dozens of incompatible systems.

---

## 3. Goals

| # | Goal | Success Criterion |
|---|------|-------------------|
| G1 | Define an open booking protocol | Published specification, peer-reviewed |
| G2 | Provide a reference server implementation | Fully functional Node.js server, Docker-ready |
| G3 | Provide a reference frontend | Next.js booking UI + provider dashboard |
| G4 | Enable federation between servers | 2 independent servers can discover and book from each other |
| G5 | Provide developer tooling | JS SDK, Python SDK, validator CLI |
| G6 | Publish documentation | VitePress docs site, Getting Started, API Reference |
| G7 | Apply for NLnet funding | Submitted proposal |

---

## 4. Out of Scope

- Payment processing (out of scope for v1; extension point defined)
- Video conferencing integration
- Mobile native apps
- Multi-tenant SaaS hosting

---

## 5. Stakeholders

| Role | Responsibility |
|------|----------------|
| Protocol author | Specification design, reference implementation |
| Service providers | Implement or self-host an OBP server |
| End users | Book appointments via OBP-compatible clients |
| Third-party developers | Build on top of OBP using the SDK |
| NLnet / NGI Zero | Potential grant funder |

---

## 6. Deliverables

| Deliverable | Phase | Description |
|-------------|-------|-------------|
| Protocol specification | 1 | OpenAPI 3.1 YAML + markdown spec documents |
| Reference server | 2 | Node.js + Fastify + PostgreSQL + Redis |
| Reference frontend | 3 | Next.js 14, booking UI + provider dashboard |
| JavaScript SDK | 4 | `@obp/client` npm package |
| Python SDK | 4 | `obp-client` PyPI package |
| Validator CLI | 4 | Compliance checker for OBP implementations |
| Documentation site | 4 | VitePress site with guides, API ref, tutorials |
| Demo deployment | 4 | Two federated servers running live |

---

## 7. Constraints

- **License:** AGPL-3.0 (copyleft, no proprietary forks without source disclosure)
- **Technology:** Node.js 20+, TypeScript, PostgreSQL 15+, Redis 7+
- **Standards compliance:** OpenAPI 3.1, RFC 7807 (errors), RFC 9421 (HTTP Signatures), WebFinger (RFC 7033)

---

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Specification changes mid-development | Medium | High | Freeze spec before Phase 2 |
| Federation complexity underestimated | Medium | High | Prototype early, integrate in Phase 2 |
| Low adoption without marketing | High | Medium | Focus on NLnet grant + open source community |
| Performance issues under load | Low | High | Load test with k6 before release |

---

## 9. Timeline

| Milestone | Target |
|-----------|--------|
| Phase 0 — Project setup complete | 2026 Q1 |
| Phase 1 — Specification complete | 2026 Q2 |
| Phase 2 — Reference server complete | 2026 Q2 |
| Phase 3 — Reference frontend complete | 2026 Q3 |
| Phase 4 — SDK, docs, finalization | 2026 Q3 |
| NLnet grant submission | 2026 Q3 |
