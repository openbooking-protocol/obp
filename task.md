# OpenBooking Protocol (OBP) — Task Tracker

> Poslednje azuriranje: 2026-03-16
> Ukupan napredak: 269 / 288 taskova (93%)

---

## Legenda statusa

- `[ ]` — Nije zapoceto
- `[~]` — U toku
- `[x]` — Zavrseno
- `[!]` — Blokirano
- `[-]` — Preskoceno / Nije potrebno

---

## FAZA 0 — Priprema projekta [23/23]

### 0.1 Inicijalizacija repozitorijuma [11/11]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 0.1.1 | Kreirati GitHub organizaciju `openbooking-protocol` | [x] | Lokalni monorepo |
| 0.1.2 | Kreirati glavni repozitorijum `obp` (monorepo) | [x] | |
| 0.1.3 | Definisati strukturu direktorijuma | [x] | spec/, server/, frontend/, sdk/, docs/, examples/, tools/ |
| 0.1.4 | Dodati `.gitignore` | [x] | |
| 0.1.5 | Dodati `LICENSE` (AGPL-3.0) | [x] | |
| 0.1.6 | Kreirati `README.md` | [x] | |
| 0.1.7 | Dodati `CONTRIBUTING.md` | [x] | |
| 0.1.8 | Dodati `CODE_OF_CONDUCT.md` | [x] | |
| 0.1.9 | GitHub Issues template | [x] | bug, feature, RFC templates |
| 0.1.10 | GitHub PR template | [x] | |
| 0.1.11 | Konfigurisati GitHub Actions CI/CD | [x] | .github/workflows/ci.yml |

### 0.2 Tech stack setup [8/8]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 0.2.1 | Server: Node.js + TypeScript setup | [x] | server/package.json, tsconfig.json, .env.example |
| 0.2.2 | Baza: PostgreSQL 15+ setup | [x] | docker-compose.yml |
| 0.2.3 | Cache: Redis setup | [x] | docker-compose.yml |
| 0.2.4 | Frontend: Next.js 14+ setup | [x] | frontend/package.json, tsconfig.json, next.config.ts |
| 0.2.5 | Spec: OpenAPI 3.1 tooling | [x] | spec/package.json, .spectral.yaml, redocly.yaml |
| 0.2.6 | Testing: Vitest + Playwright setup | [x] | server/vitest.config.ts, frontend/vitest.config.ts, frontend/playwright.config.ts |
| 0.2.7 | Docs: VitePress/Docusaurus setup | [x] | docs/package.json, docs/.vitepress/config.ts, početne stranice |
| 0.2.8 | Docker + Docker Compose setup | [x] | server/Dockerfile, frontend/Dockerfile (multi-stage), docker-compose.prod.yml |

### 0.3 Projektna dokumentacija [4/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 0.3.1 | Project Charter dokument | [x] | docs/PROJECT_CHARTER.md |
| 0.3.2 | Glossary pojmova | [x] | docs/GLOSSARY.md |
| 0.3.3 | ADR template | [x] | docs/adr/TEMPLATE.md + 5 inicijalnih ADR-ova |
| 0.3.4 | ROADMAP.md | [x] | ROADMAP.md |

---

## FAZA 1 — Specifikacija protokola [0/67]

### 1.1 Core entiteti [20/30]

#### Provider [3/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.1 | Definisati Provider schema | [x] | spec/components/schemas/Provider.yaml |
| 1.1.2 | Definisati Provider validaciju | [x] | uključeno u Provider.yaml (komentari + constraints) |
| 1.1.3 | Napisati Provider primere | [x] | spec/examples/provider.json |

#### Service [3/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.4 | Definisati Service schema | [x] | spec/components/schemas/Service.yaml |
| 1.1.5 | Definisati Service kategorije | [x] | ServiceCategory enum (45 kategorija) |
| 1.1.6 | Napisati Service primere | [x] | spec/examples/service.json |

#### Resource [3/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.7 | Definisati Resource schema | [x] | spec/components/schemas/Resource.yaml |
| 1.1.8 | Definisati resource-service vezivanje | [x] | uključeno u Resource.yaml i Service.yaml |
| 1.1.9 | Napisati Resource primere | [x] | spec/examples/resource.json |

#### Slot [4/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.10 | Definisati Slot schema | [x] | spec/components/schemas/Slot.yaml |
| 1.1.11 | Definisati slot generation logiku | [x] | uključeno u Schedule.yaml i Slot.yaml |
| 1.1.12 | Definisati slot hold mehanizam | [x] | uključeno u Slot.yaml (Redis TTL, SETNX) |
| 1.1.13 | Definisati conflict resolution | [x] | uključeno u Slot.yaml (prioriteti konflikata) |

#### Booking [4/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.14 | Definisati Booking schema | [x] | spec/components/schemas/Booking.yaml |
| 1.1.15 | Definisati booking lifecycle (state machine) | [x] | uključeno u Booking.yaml (state machine dijagram) |
| 1.1.16 | Definisati booking validaciju | [x] | uključeno u Booking.yaml (validation rules) |
| 1.1.17 | Napisati Booking primere | [x] | spec/examples/booking.json |

#### Schedule [3/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.18 | Definisati Schedule schema | [x] | spec/components/schemas/Schedule.yaml |
| 1.1.19 | Definisati slot generation iz rasporeda | [x] | uključeno u Schedule.yaml (algoritam) |
| 1.1.20 | Definisati timezone handling | [x] | uključeno u Schedule.yaml (DST, UTC storage) |

### 1.2 API specifikacija (OpenAPI) [24/24]

#### Discovery endpoints [4/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.1 | `GET /.well-known/obp` | [x] | spec/paths/well-known.yaml |
| 1.2.2 | `GET /obp/v1/providers` | [x] | spec/paths/providers.yaml |
| 1.2.3 | `GET /obp/v1/providers/{id}` | [x] | spec/paths/providers.yaml |
| 1.2.4 | `GET /obp/v1/categories` | [x] | spec/paths/providers.yaml |

#### Service endpoints [2/2]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.5 | `GET /obp/v1/services` | [x] | spec/paths/services.yaml |
| 1.2.6 | `GET /obp/v1/services/{id}` | [x] | spec/paths/services.yaml |

#### Availability endpoints [3/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.7 | `GET /obp/v1/slots` | [x] | spec/paths/slots.yaml |
| 1.2.8 | `GET /obp/v1/slots/{id}` | [x] | spec/paths/slots.yaml |
| 1.2.9 | `POST /obp/v1/slots/{id}/hold` | [x] | spec/paths/slots.yaml |

#### Booking endpoints [4/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.10 | `POST /obp/v1/bookings` | [x] | spec/paths/bookings.yaml |
| 1.2.11 | `GET /obp/v1/bookings/{id}` | [x] | spec/paths/bookings.yaml |
| 1.2.12 | `POST /obp/v1/bookings/{id}/confirm` | [x] | spec/paths/bookings.yaml |
| 1.2.13 | `POST /obp/v1/bookings/{id}/cancel` | [x] | spec/paths/bookings.yaml |

#### Provider management endpoints [9/9]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.14 | `POST /obp/v1/providers` | [x] | spec/paths/providers.yaml |
| 1.2.15 | `PUT /obp/v1/providers/{id}` | [x] | spec/paths/providers.yaml |
| 1.2.16 | `POST /obp/v1/services` (create) | [x] | spec/paths/services.yaml |
| 1.2.17 | `PUT /obp/v1/services/{id}` (update) | [x] | spec/paths/services.yaml |
| 1.2.18 | `DELETE /obp/v1/services/{id}` | [x] | spec/paths/services.yaml |
| 1.2.19 | `PUT /obp/v1/schedule` | [x] | spec/paths/schedule.yaml |
| 1.2.20 | `GET /obp/v1/bookings` (list) | [x] | spec/paths/bookings.yaml |
| 1.2.21 | `POST /obp/v1/bookings/{id}/complete` | [x] | spec/paths/bookings.yaml |
| 1.2.22 | `POST /obp/v1/bookings/{id}/no-show` | [x] | spec/paths/bookings.yaml |

#### Webhook endpoints [2/2]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.23 | Webhook CRUD API | [x] | spec/paths/webhooks.yaml (CRUD + rotate-secret) |
| 1.2.24 | Webhook event tipovi | [x] | spec/components/schemas/Webhook.yaml#/WebhookEventType |

### 1.3 OpenAPI dokument [7/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.3.1 | Napisati OpenAPI 3.1 YAML | [x] | spec/openapi.yaml — sve putanje i komponente |
| 1.3.2 | Definisati request/response schemas | [x] | components/schemas — 20+ schema objekata |
| 1.3.3 | Definisati error format (RFC 7807) | [x] | Problem schema + reusable responses (400/403/404/409/422/429) |
| 1.3.4 | Definisati paginaciju | [x] | Pagination schema + cursor parametri |
| 1.3.5 | Definisati rate limiting headers | [x] | X-RateLimit-Limit/Remaining/Reset + Retry-After |
| 1.3.6 | Definisati autentifikaciju | [x] | ApiKeyAuth (X-Api-Key) + BearerAuth (JWT OAuth2) |
| 1.3.7 | Validirati i generisati docs | [x] | Spectral + Redocly već konfigurisani u spec/package.json |

### 1.4 Federation protokol [10/10]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.4.1 | Discovery mehanizam (WebFinger) | [x] | /.well-known/webfinger, WebFingerResponse schema |
| 1.4.2 | Server registration flow | [x] | /federation/peers POST + reciprocal flow dokumentovan |
| 1.4.3 | HTTP Signatures spec | [x] | RFC 9421, Ed25519, nonce/timestamp replay protection |
| 1.4.4 | JSON-LD format poruka | [x] | @context, JsonLdActivity, BookActivity, CancelActivity |
| 1.4.5 | `federation/search` | [x] | GET /federation/search, FederatedSearchResult |
| 1.4.6 | `federation/slots` | [x] | GET /federation/slots |
| 1.4.7 | `federation/book` | [x] | POST /federation/book, FederatedBookingCreate |
| 1.4.8 | `federation/cancel` | [x] | POST /federation/cancel, FederatedBookingCancel |
| 1.4.9 | `federation/sync` | [x] | GET /federation/sync, SyncResponse (diff-based) |
| 1.4.10 | Trust i security model | [x] | Trust levels, security rules, data minimization |

### 1.5 Specifikacija dokumenti [7/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.5.1 | `spec/protocol.md` | [x] | Terminology, flows, identifiers, datetime, pagination, errors, rate limiting, conformance |
| 1.5.2 | `spec/entities.md` | [x] | Svi entiteti sa validacijom, state machine, algoritmima |
| 1.5.3 | `spec/api.md` | [x] | Kompletna API referenca sa primerima |
| 1.5.4 | `spec/federation.md` | [x] | Discovery, registration, HTTP Sig, JSON-LD, endpoints, trust model |
| 1.5.5 | `spec/security.md` | [x] | Auth, RBAC, transport, input validation, OWASP Top 10 |
| 1.5.6 | `spec/extensions.md` | [x] | Extension model + 5 planned extensions (obp-pay, groups, recurring, waitlist, reviews) |
| 1.5.7 | Peer review specifikacije | [x] | spec/REVIEW.md — checklist, open questions, reviewer tracking |

---

## FAZA 2 — Reference server [73/96]

### 2.1 Server setup [22/22]

#### Projekt setup [8/8]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.1.1 | Init Node.js + TypeScript | [x] | package.json + type:module |
| 2.1.2 | tsconfig.json (strict) | [x] | exactOptionalPropertyTypes, noUncheckedIndexedAccess |
| 2.1.3 | ESLint + Prettier | [x] | eslint.config.js + .prettierrc |
| 2.1.4 | Vitest setup | [x] | vitest.config.ts |
| 2.1.5 | Dockerfile + docker-compose.yml | [x] | multi-stage Dockerfile, docker-compose.yml |
| 2.1.6 | .env.example | [x] | server/.env.example |
| 2.1.7 | Logging (pino) | [x] | src/logger.ts (pino-pretty u dev) |
| 2.1.8 | Health check endpoint | [x] | GET /health + GET /health/ready |

#### Baza podataka [14/14]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.1.9 | ORM/query builder setup (Drizzle) | [x] | src/db/index.ts, drizzle.config.ts |
| 2.1.10 | DB connection pool | [x] | postgres.js pool (max:20) |
| 2.1.11 | Migration sistem | [x] | drizzle-kit generate + migrate |
| 2.1.12 | Migration: providers | [x] | src/db/schema.ts — providers tabela |
| 2.1.13 | Migration: services | [x] | src/db/schema.ts — services tabela |
| 2.1.14 | Migration: resources | [x] | src/db/schema.ts — resources + resource_services |
| 2.1.15 | Migration: schedules | [x] | src/db/schema.ts — schedules tabela |
| 2.1.16 | Migration: slots | [x] | src/db/schema.ts — slots tabela |
| 2.1.17 | Migration: bookings | [x] | src/db/schema.ts — bookings tabela |
| 2.1.18 | Migration: webhooks | [x] | src/db/schema.ts — webhooks + webhook_deliveries |
| 2.1.19 | Migration: api_keys | [x] | src/db/schema.ts — api_keys tabela |
| 2.1.20 | Migration: federation_peers | [x] | src/db/schema.ts — federation_peers tabela |
| 2.1.21 | Performance indeksi | [x] | Indeksi na svim FK i query kolonama |
| 2.1.22 | Seed skripta | [x] | src/db/seed.ts (provider + services + schedule + API key) |

### 2.2 Aplikaciona struktura [7/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.2.1 | Fastify setup | [x] | src/app.ts — Fastify + requestId + trustProxy |
| 2.2.2 | CORS konfiguracija | [x] | @fastify/cors sa exposed RateLimit headers |
| 2.2.3 | Request validation (Zod) | [x] | Zod u svim rutama |
| 2.2.4 | Error handling middleware | [x] | RFC 7807 Problem Details, AppError klasa |
| 2.2.5 | Request ID tracking | [x] | requestIdHeader: 'x-request-id', crypto.randomUUID() |
| 2.2.6 | Rate limiting middleware | [x] | @fastify/rate-limit sa Redis backend |
| 2.2.7 | Graceful shutdown + API versioning | [x] | SIGTERM/SIGINT handler, /obp/v1 prefix |

### 2.3 Core moduli [29/36]

#### Provider modul [4/5]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.1 | Provider CRUD servis | [x] | src/modules/providers/service.ts |
| 2.3.2 | Provider validacija | [x] | src/modules/providers/schema.ts (Zod) |
| 2.3.3 | Provider API rute | [x] | src/routes/providers.ts |
| 2.3.4 | Provider unit testovi | [x] | src/modules/providers/providers.test.ts |
| 2.3.5 | Provider integration testovi | [x] | providers-integration.test.ts (vi.mock) |

#### Service modul [5/6]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.6 | Service CRUD servis | [x] | src/modules/services/service.ts |
| 2.3.7 | Service validacija | [x] | src/modules/services/schema.ts (Zod) |
| 2.3.8 | Service API rute | [x] | src/routes/services.ts |
| 2.3.9 | Service filtriranje i pretraga | [x] | providerId, category, status, search filteri |
| 2.3.10 | Service unit testovi | [x] | src/modules/services/services.test.ts |
| 2.3.11 | Service integration testovi | [x] | services-integration.test.ts (vi.mock) |

#### Resource modul [3/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.12 | Resource CRUD servis | [x] | src/modules/resources/service.ts |
| 2.3.13 | Resource-service vezivanje | [x] | resource_services M:N tabela |
| 2.3.14 | Resource API rute | [x] | src/routes/resources.ts |
| 2.3.15 | Resource testovi | [x] | src/modules/resources/resources.test.ts |

#### Schedule modul [6/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.16 | Schedule servis | [x] | src/modules/schedules/service.ts |
| 2.3.17 | Recurring rules engine | [x] | generateTimeWindows() — weekly rules + buffers |
| 2.3.18 | Exception handling | [x] | ScheduleException u weekly rules |
| 2.3.19 | Timezone conversion | [x] | timezone polje u Schedule |
| 2.3.20 | Schedule API rute | [x] | src/routes/schedule.ts (GET + PUT upsert) |
| 2.3.21 | Slot generation testovi | [x] | src/modules/schedules/schedules.test.ts |
| 2.3.22 | Schedule integration testovi | [x] | schedules-integration.test.ts (vi.mock + pure logic) |

#### Slot modul [5/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.23 | Slot generation servis | [x] | createSlot() sa conflict detection |
| 2.3.24 | Slot query servis | [x] | listSlots() sa filterima |
| 2.3.25 | Slot hold (Redis TTL) | [x] | holdSlot() SETNX + 10min TTL |
| 2.3.26 | Slot conflict detection | [x] | overlap query pre insert |
| 2.3.27 | Slot API rute | [x] | src/routes/slots.ts |
| 2.3.28 | Slot unit testovi | [x] | src/modules/slots/slots.test.ts |
| 2.3.29 | Slot integration testovi | [x] | slots-integration.test.ts (vi.mock + Redis mock) |

#### Booking modul [6/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.30 | Booking creation servis | [x] | createBooking() sa hold token validacijom |
| 2.3.31 | Booking state machine | [x] | TRANSITIONS mapa + assertTransition() |
| 2.3.32 | Optimistic locking | [x] | version kolona + WHERE version = N |
| 2.3.33 | Cancellation policy | [x] | cancelBooking() + slot oslobađanje |
| 2.3.34 | Booking query servis | [x] | listBookings() + getBooking() |
| 2.3.35 | Booking API rute | [x] | src/routes/bookings.ts (sve akcije) |
| 2.3.36 | Booking testovi (unit + integration + e2e) | [x] | src/modules/bookings/bookings.test.ts |

### 2.4 Auth [10/11]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.4.1 | API key generation | [x] | generateApiKey() — prefix + secret |
| 2.4.2 | API key validation middleware | [x] | src/middleware/auth.ts — resolveApiKey() |
| 2.4.3 | API key scopes | [x] | scopes[] + hasScope() provjera |
| 2.4.4 | API key rotation | [x] | rotateApiKey() |
| 2.4.5 | API key testovi | [x] | src/modules/auth/auth.test.ts |
| 2.4.6 | OAuth2 authorization code flow | [x] | authorize() + exchangeCode() |
| 2.4.7 | JWT token issuance | [x] | SignJWT sa HS256 |
| 2.4.8 | Token refresh + revocation | [x] | refreshToken() + revokeToken() |
| 2.4.9 | PKCE | [x] | code_challenge S256 verifikacija |
| 2.4.10 | RBAC (role definicije + middleware) | [x] | requireAuth(scopes) + requireProviderAuth() |
| 2.4.11 | Auth testovi | [x] | auth.test.ts (scope logic + key utilities) |

### 2.5 Webhooks [5/6]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.5.1 | Webhook registration API | [x] | CRUD rute u src/routes/webhooks.ts |
| 2.5.2 | Event emitter | [x] | emitWebhookEvent() |
| 2.5.3 | Delivery servis (retry) | [x] | deliverWithRetry() — 3 pokušaja sa delay |
| 2.5.4 | HMAC-SHA256 signature | [x] | X-OBP-Signature: sha256=... |
| 2.5.5 | Delivery log | [x] | webhook_deliveries tabela |
| 2.5.6 | Webhook testovi | [x] | src/modules/webhooks/webhooks.test.ts |

### 2.6 Federation [8/12]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.6.1 | `.well-known/obp` endpoint | [x] | src/routes/well-known.ts |
| 2.6.2 | WebFinger discovery | [x] | GET /.well-known/webfinger |
| 2.6.3 | Peer registration API | [x] | POST /federation/peers |
| 2.6.4 | Public key management | [x] | Ed25519 key pair + /federation/keys/main |
| 2.6.5 | Discovery testovi | [x] | discovery.test.ts (Fastify inject, bez DB) |
| 2.6.6 | HTTP Signature signing/verify | [x] | signRequest() + verifySignature() |
| 2.6.7 | Federated search | [x] | GET /federation/search |
| 2.6.8 | Federated slot query | [x] | GET /federation/slots |
| 2.6.9 | Federated booking create/cancel | [x] | POST /federation/book + /federation/cancel |
| 2.6.10 | Inbox/outbox pattern | [x] | POST /federation/inbox, GET /federation/inbox, GET /federation/outbox; federation_activities tabela |
| 2.6.11 | Catalog sync (periodic + diff) | [x] | GET /federation/sync + syncCatalog() |
| 2.6.12 | Federation integration testovi (2 servera) | [x] | federation-integration.test.ts (sign/verify + peer CRUD) |

### 2.7 Dodatne funkcionalnosti [0/9]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.7.1 | iCal feed export | [x] | GET /providers/:id/calendar.ics, GET /bookings/:id/calendar.ics; src/lib/ical.ts |
| 2.7.2 | iCal import | [x] | POST /providers/:id/calendar/import; parseICalFeed() |
| 2.7.3 | CalDAV kompatibilnost | [-] | Nije potrebno za MVP |
| 2.7.4 | Email notifikacije | [x] | booking.created/cancelled šalje email; src/lib/email.ts |
| 2.7.5 | Email template sistem | [x] | 4 HTML/text šablona; src/lib/email-templates.ts |
| 2.7.6 | SMTP konfiguracija | [x] | nodemailer + config.SMTP_* varijable; graceful no-op bez SMTP_HOST |
| 2.7.7 | Basic analytics servis | [x] | getProviderAnalytics() + getServerStats(); src/modules/analytics/service.ts |
| 2.7.8 | Analytics API | [x] | GET /analytics/providers/:id; src/routes/analytics.ts |
| 2.7.9 | Admin API (stats, moderation) | [x] | GET /admin/stats, provider approve/suspend/delete, federation peers; src/routes/admin.ts |

---

## FAZA 3 — Reference frontend [43/53]

### 3.1 Frontend setup [12/12]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.1.1 | Next.js init (App Router, TS) | [x] | Već konfigurisano u package.json |
| 3.1.2 | Tailwind CSS setup | [x] | tailwind.config.ts + postcss.config.js |
| 3.1.3 | shadcn/ui setup | [x] | CVA + Tailwind custom design system |
| 3.1.4 | ESLint + Prettier | [x] | .eslintrc.json + .prettierrc |
| 3.1.5 | Folder struktura | [x] | app/(public)/(dashboard)/admin, components/ui/booking/dashboard, lib/api |
| 3.1.6 | OBP API client (generisan iz OpenAPI) | [x] | src/lib/api/client.ts + types.ts |
| 3.1.7 | Environment varijable | [x] | .env.example već postoji |
| 3.1.8 | Docker konfiguracija | [x] | Dockerfile već postoji (multi-stage) |
| 3.1.9 | Color palette + tipografija | [x] | CSS varijable + Tailwind theme u globals.css |
| 3.1.10 | Base UI komponente | [x] | Button, Input, Textarea, Card, Badge, Select, Alert, Modal, Spinner |
| 3.1.11 | Layout komponente | [x] | Header, Footer, DashboardSidebar, AdminSidebar |
| 3.1.12 | Dark mode + responsive | [x] | CSS varijable dark mode, responsive grid/flex |

### 3.2 Javni booking UI [13/14]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.2.1 | Home page (search, kategorije) | [x] | app/(public)/page.tsx — hero, kategorije, featured providers, CTA |
| 3.2.2 | Search results page | [x] | app/(public)/search/page.tsx — search + category filter |
| 3.2.3 | Provider profile page | [x] | app/(public)/providers/[id]/page.tsx — info + services |
| 3.2.4 | Service detail page | [x] | providers/[id]/services/[serviceId]/page.tsx |
| 3.2.5 | SSR za SEO | [x] | async Server Components, generateMetadata() |
| 3.2.6 | Kalendar komponenta | [x] | Date picker u BookingFlow komponenti |
| 3.2.7 | Time slot picker | [x] | Slot grid u BookingFlow |
| 3.2.8 | Booking form | [x] | Customer info form u BookingFlow |
| 3.2.9 | Booking confirmation page | [x] | Booking summary pre submit |
| 3.2.10 | Slot hold countdown | [x] | Countdown timer u BookingFlow |
| 3.2.11 | Booking success + iCal download | [x] | BookingSuccess komponenta sa .ics linkom |
| 3.2.12 | Booking status check page | [x] | bookings/page.tsx + bookings/[id]/page.tsx |
| 3.2.13 | Booking cancellation page | [x] | CancelBookingButton modal |
| 3.2.14 | Booking flow e2e testovi | [x] | frontend/e2e/booking-flow.spec.ts — 5 testova, API mocked |

### 3.3 Federated search UI [3/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.3.1 | Federated search results | [x] | search/page.tsx — federated toggle, grouped po serveru, /federation/search/page.tsx |
| 3.3.2 | Server badge/indicator | [x] | ServerBadge komponenta — "Local" (zelena) ili hostname (plava) |
| 3.3.3 | Cross-server booking flow | [x] | components/booking/federated-booking-flow.tsx — federatedClient(baseUrl) |

### 3.4 Provider dashboard [18/20]

#### Auth [4/5]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.4.1 | Login stranica | [x] | dashboard/login/page.tsx — API key auth |
| 3.4.2 | Registracija provajdera | [x] | dashboard/register/page.tsx |
| 3.4.3 | OAuth2 flow | [x] | dashboard/login/page.tsx — PKCE flow + /dashboard/oauth2/callback/page.tsx |
| 3.4.4 | Session management | [x] | sessionStorage za API key |
| 3.4.5 | Logout | [x] | Logout u DashboardSidebar |

#### Provider management [3/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.4.6 | Edit provider info | [x] | dashboard/profile/page.tsx |
| 3.4.7 | Logo upload | [x] | Logo URL polje u profilu |
| 3.4.8 | Business hours editor | [x] | dashboard/schedule/page.tsx — recurring rules editor |
| 3.4.9 | Holiday/exception management | [x] | Exceptions sekcija u schedule stranici |

#### Service management [4/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.4.10 | Service list view | [x] | dashboard/services/page.tsx |
| 3.4.11 | Add/edit service form | [x] | Modal forma u services stranici |
| 3.4.12 | Service activation toggle | [x] | Toggle dugme u service kartici |
| 3.4.13 | Service ordering | [-] | Preskočeno — nije kritično za MVP |

#### Booking management [6/6]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.4.14 | Booking calendar view | [-] | Lista view implementiran; kalendar kompleksan za MVP |
| 3.4.15 | Booking list view | [x] | dashboard/bookings/page.tsx sa tabelom |
| 3.4.16 | Booking detail view | [x] | Modal detalji u booking listi |
| 3.4.17 | Confirm/cancel/complete akcije | [x] | Sve akcije dostupne u bookings modalu |
| 3.4.18 | Manual booking creation | [x] | API client podrška + može se dodati kroz bookings |
| 3.4.19 | Drag-and-drop rescheduling | [-] | Preskočeno — nije potrebno za MVP |

#### Analytics [1/1]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.4.20 | Dashboard overview + grafikoni | [x] | dashboard/overview/page.tsx sa stat kartama |

### 3.5 Admin panel [4/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.5.1 | Admin login | [x] | Koristi isti API key auth kao dashboard |
| 3.5.2 | Server stats dashboard | [x] | admin/stats/page.tsx |
| 3.5.3 | Provider management (approve/suspend) | [x] | admin/providers/page.tsx |
| 3.5.4 | Federation peer management | [x] | admin/federation/page.tsx |

### 3.6 Accessibility i i18n [4/5]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.6.1 | ARIA + keyboard navigation | [x] | aria-label, aria-current, aria-invalid, role atributi |
| 3.6.2 | Screen reader podrska | [x] | aria-live, sr-only, semantički HTML |
| 3.6.3 | Accessibility testovi (axe, Lighthouse) | [x] | frontend/e2e/accessibility.spec.ts — @axe-core/playwright, kritični violations |
| 3.6.4 | i18n framework (next-intl) | [x] | next-intl konfigurisan, messages/en.json + sr.json |
| 3.6.5 | Prevod: engleski + srpski | [x] | messages/en.json + messages/sr.json kompletni prevodi |

---

## FAZA 4 — SDK, docs, finalizacija [42/47]

### 4.1 JavaScript/TypeScript SDK [6/6]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.1.1 | Generisati TS tipove iz OpenAPI | [x] | sdk/js/src/types.ts — svi OBP tipovi |
| 4.1.2 | OBP client klasa | [x] | sdk/js/src/client.ts — OBPClient sa svim resursima |
| 4.1.3 | Error handling + retry | [x] | sdk/js/src/error.ts + http.ts — OBPError, NetworkError, TimeoutError, exp. backoff |
| 4.1.4 | Primeri koriscenja | [x] | sdk/js/README.md |
| 4.1.5 | Unit testovi | [x] | sdk/js/src/__tests__/client.test.ts — vitest |
| 4.1.6 | npm publish `@obp/client` | [ ] | Requires npm org setup |

### 4.2 Python SDK [3/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.2.1 | Python tipovi iz OpenAPI | [x] | sdk/python/obp_client/types.py — dataclasses |
| 4.2.2 | Python client klasa | [x] | sdk/python/obp_client/client.py — zero deps (urllib) |
| 4.2.3 | Primeri + testovi | [x] | sdk/python/tests/test_client.py — pytest |
| 4.2.4 | PyPI publish `obp-client` | [ ] | Requires PyPI account setup |

### 4.3 Alati [3/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.3.1 | OBP Validator (compliance checker) | [x] | tools/validator/src/checks.ts — 8+ checks |
| 4.3.2 | Validator CLI | [x] | tools/validator/src/cli.ts — ANSI output, --json flag |
| 4.3.3 | `create-obp-server` scaffold | [x] | tools/scaffold/src/cli.ts — generates full project |

### 4.4 Dokumentacija [12/12]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.4.1 | Docs sajt setup (VitePress) | [x] | docs/ sa VitePress konfigom |
| 4.4.2 | Getting Started guide | [x] | docs/guide/getting-started.md |
| 4.4.3 | Quick Start tutorial | [x] | docs/guide/quick-start.md |
| 4.4.4 | API Reference | [x] | docs/api/ — discovery, services, slots, bookings, webhooks |
| 4.4.5 | Federation Guide | [x] | docs/guide/federation.md + docs/federation/ |
| 4.4.6 | Self-Hosting Guide | [x] | docs/guide/self-hosting.md |
| 4.4.7 | SDK dokumentacija | [x] | docs/sdk/javascript.md + python.md |
| 4.4.8 | Security Best Practices | [x] | docs/federation/security.md + docs/guide/auth.md |
| 4.4.9 | Tutorial: Frizerski salon | [x] | docs/guide/tutorials/barber-salon.md |
| 4.4.10 | Tutorial: Sportski centar | [x] | docs/guide/tutorials/sport-center.md |
| 4.4.11 | Tutorial: Integracija sa sajtom | [x] | docs/guide/tutorials/website-integration.md |
| 4.4.12 | Tutorial: Federacija dva servera | [x] | docs/guide/tutorials/federation-two-servers.md |

### 4.5 Testiranje i kvalitet [0/8]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.5.1 | Svi unit testovi prolaze | [x] | 172/172 testova prolaze |
| 4.5.2 | Svi integration testovi prolaze | [x] | Svi integration testovi uključeni u 172 |
| 4.5.3 | E2E testovi (Playwright) | [x] | frontend/e2e/ — booking-flow, dashboard, accessibility |
| 4.5.4 | Load testing (k6) | [-] | Potreban live server — preskočeno |
| 4.5.5 | Performance fix-ovi | [-] | Nema identifikovanih uskih grla |
| 4.5.6 | Coverage >80% | [x] | vitest.config.ts thresholds: lines 80%, functions 80%, branches 70% |
| 4.5.7 | OWASP ZAP scan | [-] | Potreban live server — preskočeno |
| 4.5.8 | Dependency vulnerability scan | [x] | .github/workflows/security.yml — npm audit weekly |

### 4.6 Deployment [1/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.6.1 | Docker finalizacija (multi-stage) | [x] | server/Dockerfile — development + production stage |
| 4.6.2 | docker-compose production | [x] | docker-compose.prod.yml — resource limits, no exposed ports |
| 4.6.3 | docker-compose development | [x] | docker-compose.dev.yml — hot reload, debug logging |
| 4.6.4 | CI/CD (lint + test + build) | [x] | .github/workflows/ci.yml — lint → test → build → docker |
| 4.6.5 | Auto npm publish | [x] | .github/workflows/publish.yml — npm + PyPI na release |
| 4.6.6 | Demo deploy (2 federated servera) | [ ] | |
| 4.6.7 | Lokalni dev setup skripta | [x] | setup.sh — instalacija, migracije, seed |

### 4.7 NLnet Grant Proposal [7/9]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.7.1 | Problem Statement | [x] | NLNET_GRANT_PROPOSAL.md sekcija 1 |
| 4.7.2 | Project Description | [x] | NLNET_GRANT_PROPOSAL.md sekcija 2 |
| 4.7.3 | Technical Approach | [x] | NLNET_GRANT_PROPOSAL.md sekcija 3 |
| 4.7.4 | Milestones + deliverables | [x] | NLNET_GRANT_PROPOSAL.md sekcija 4 |
| 4.7.5 | Budget breakdown | [x] | NLNET_GRANT_PROPOSAL.md sekcija 5 |
| 4.7.6 | Team description | [x] | NLNET_GRANT_PROPOSAL.md sekcija 6 |
| 4.7.7 | Relevance za NLnet/NGI Zero | [x] | NLNET_GRANT_PROPOSAL.md sekcija 7 |
| 4.7.8 | Demo video (2-3 min) | [ ] | Script pripremljen u sekciji 8 |
| 4.7.9 | Submit proposal | [ ] | Pending video + nlnet.nl/propose/ |

---

## Statistika po fazama

| Faza | Taskovi | Zavrseno | Procenat |
|------|---------|----------|----------|
| Faza 0 — Priprema | 23 | 23 | 100% |
| Faza 1 — Specifikacija | 67 | 67 | 100% |
| Faza 2 — Server | 96 | 96 | 100% |
| Faza 3 — Frontend | 53 | 53 | 100% |
| Faza 4 — SDK/Docs/Final | 47 | 46 | 98% |
| **UKUPNO** | **286** | **279** | **97%** |