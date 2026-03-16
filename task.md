# OpenBooking Protocol (OBP) — Task Tracker

> Poslednje azuriranje: 2026-03-16
> Ukupan napredak: 0 / 274 taskova (0%)

---

## Legenda statusa

- `[ ]` — Nije zapoceto
- `[~]` — U toku
- `[x]` — Zavrseno
- `[!]` — Blokirano
- `[-]` — Preskoceno / Nije potrebno

---

## FAZA 0 — Priprema projekta [0/11]

### 0.1 Inicijalizacija repozitorijuma [0/11]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 0.1.1 | Kreirati GitHub organizaciju `openbooking-protocol` | [ ] | |
| 0.1.2 | Kreirati glavni repozitorijum `obp` (monorepo) | [ ] | |
| 0.1.3 | Definisati strukturu direktorijuma | [ ] | |
| 0.1.4 | Dodati `.gitignore` | [ ] | |
| 0.1.5 | Dodati `LICENSE` (AGPL-3.0) | [ ] | |
| 0.1.6 | Kreirati `README.md` | [ ] | |
| 0.1.7 | Dodati `CONTRIBUTING.md` | [ ] | |
| 0.1.8 | Dodati `CODE_OF_CONDUCT.md` | [ ] | |
| 0.1.9 | GitHub Issues template | [ ] | |
| 0.1.10 | GitHub PR template | [ ] | |
| 0.1.11 | Konfigurisati GitHub Actions CI/CD | [ ] | |

### 0.2 Tech stack setup [0/8]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 0.2.1 | Server: Node.js + TypeScript setup | [ ] | |
| 0.2.2 | Baza: PostgreSQL 15+ setup | [ ] | |
| 0.2.3 | Cache: Redis setup | [ ] | |
| 0.2.4 | Frontend: Next.js 14+ setup | [ ] | |
| 0.2.5 | Spec: OpenAPI 3.1 tooling | [ ] | |
| 0.2.6 | Testing: Vitest + Playwright setup | [ ] | |
| 0.2.7 | Docs: VitePress/Docusaurus setup | [ ] | |
| 0.2.8 | Docker + Docker Compose setup | [ ] | |

### 0.3 Projektna dokumentacija [0/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 0.3.1 | Project Charter dokument | [ ] | |
| 0.3.2 | Glossary pojmova | [ ] | |
| 0.3.3 | ADR template | [ ] | |
| 0.3.4 | ROADMAP.md | [ ] | |

---

## FAZA 1 — Specifikacija protokola [0/67]

### 1.1 Core entiteti [0/30]

#### Provider [0/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.1 | Definisati Provider schema | [ ] | |
| 1.1.2 | Definisati Provider validaciju | [ ] | |
| 1.1.3 | Napisati Provider primere | [ ] | |

#### Service [0/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.4 | Definisati Service schema | [ ] | |
| 1.1.5 | Definisati Service kategorije | [ ] | |
| 1.1.6 | Napisati Service primere | [ ] | |

#### Resource [0/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.7 | Definisati Resource schema | [ ] | |
| 1.1.8 | Definisati resource-service vezivanje | [ ] | |
| 1.1.9 | Napisati Resource primere | [ ] | |

#### Slot [0/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.10 | Definisati Slot schema | [ ] | |
| 1.1.11 | Definisati slot generation logiku | [ ] | |
| 1.1.12 | Definisati slot hold mehanizam | [ ] | |
| 1.1.13 | Definisati conflict resolution | [ ] | |

#### Booking [0/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.14 | Definisati Booking schema | [ ] | |
| 1.1.15 | Definisati booking lifecycle (state machine) | [ ] | |
| 1.1.16 | Definisati booking validaciju | [ ] | |
| 1.1.17 | Napisati Booking primere | [ ] | |

#### Schedule [0/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.1.18 | Definisati Schedule schema | [ ] | |
| 1.1.19 | Definisati slot generation iz rasporeda | [ ] | |
| 1.1.20 | Definisati timezone handling | [ ] | |

### 1.2 API specifikacija (OpenAPI) [0/24]

#### Discovery endpoints [0/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.1 | `GET /.well-known/obp` | [ ] | |
| 1.2.2 | `GET /obp/v1/providers` | [ ] | |
| 1.2.3 | `GET /obp/v1/providers/{id}` | [ ] | |
| 1.2.4 | `GET /obp/v1/categories` | [ ] | |

#### Service endpoints [0/2]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.5 | `GET /obp/v1/services` | [ ] | |
| 1.2.6 | `GET /obp/v1/services/{id}` | [ ] | |

#### Availability endpoints [0/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.7 | `GET /obp/v1/slots` | [ ] | |
| 1.2.8 | `GET /obp/v1/slots/{id}` | [ ] | |
| 1.2.9 | `POST /obp/v1/slots/{id}/hold` | [ ] | |

#### Booking endpoints [0/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.10 | `POST /obp/v1/bookings` | [ ] | |
| 1.2.11 | `GET /obp/v1/bookings/{id}` | [ ] | |
| 1.2.12 | `POST /obp/v1/bookings/{id}/confirm` | [ ] | |
| 1.2.13 | `POST /obp/v1/bookings/{id}/cancel` | [ ] | |

#### Provider management endpoints [0/9]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.14 | `POST /obp/v1/providers` | [ ] | |
| 1.2.15 | `PUT /obp/v1/providers/{id}` | [ ] | |
| 1.2.16 | `POST /obp/v1/services` (create) | [ ] | |
| 1.2.17 | `PUT /obp/v1/services/{id}` (update) | [ ] | |
| 1.2.18 | `DELETE /obp/v1/services/{id}` | [ ] | |
| 1.2.19 | `PUT /obp/v1/schedule` | [ ] | |
| 1.2.20 | `GET /obp/v1/bookings` (list) | [ ] | |
| 1.2.21 | `POST /obp/v1/bookings/{id}/complete` | [ ] | |
| 1.2.22 | `POST /obp/v1/bookings/{id}/no-show` | [ ] | |

#### Webhook endpoints [0/2]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.2.23 | Webhook CRUD API | [ ] | |
| 1.2.24 | Webhook event tipovi | [ ] | |

### 1.3 OpenAPI dokument [0/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.3.1 | Napisati OpenAPI 3.1 YAML | [ ] | |
| 1.3.2 | Definisati request/response schemas | [ ] | |
| 1.3.3 | Definisati error format (RFC 7807) | [ ] | |
| 1.3.4 | Definisati paginaciju | [ ] | |
| 1.3.5 | Definisati rate limiting headers | [ ] | |
| 1.3.6 | Definisati autentifikaciju | [ ] | |
| 1.3.7 | Validirati i generisati docs | [ ] | |

### 1.4 Federation protokol [0/10]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.4.1 | Discovery mehanizam (WebFinger) | [ ] | |
| 1.4.2 | Server registration flow | [ ] | |
| 1.4.3 | HTTP Signatures spec | [ ] | |
| 1.4.4 | JSON-LD format poruka | [ ] | |
| 1.4.5 | `federation/search` | [ ] | |
| 1.4.6 | `federation/slots` | [ ] | |
| 1.4.7 | `federation/book` | [ ] | |
| 1.4.8 | `federation/cancel` | [ ] | |
| 1.4.9 | `federation/sync` | [ ] | |
| 1.4.10 | Trust i security model | [ ] | |

### 1.5 Specifikacija dokumenti [0/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 1.5.1 | `spec/protocol.md` | [ ] | |
| 1.5.2 | `spec/entities.md` | [ ] | |
| 1.5.3 | `spec/api.md` | [ ] | |
| 1.5.4 | `spec/federation.md` | [ ] | |
| 1.5.5 | `spec/security.md` | [ ] | |
| 1.5.6 | `spec/extensions.md` | [ ] | |
| 1.5.7 | Peer review specifikacije | [ ] | |

---

## FAZA 2 — Reference server [0/96]

### 2.1 Server setup [0/22]

#### Projekt setup [0/8]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.1.1 | Init Node.js + TypeScript | [ ] | |
| 2.1.2 | tsconfig.json (strict) | [ ] | |
| 2.1.3 | ESLint + Prettier | [ ] | |
| 2.1.4 | Vitest setup | [ ] | |
| 2.1.5 | Dockerfile + docker-compose.yml | [ ] | |
| 2.1.6 | .env.example | [ ] | |
| 2.1.7 | Logging (pino) | [ ] | |
| 2.1.8 | Health check endpoint | [ ] | |

#### Baza podataka [0/14]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.1.9 | ORM/query builder setup (Drizzle) | [ ] | |
| 2.1.10 | DB connection pool | [ ] | |
| 2.1.11 | Migration sistem | [ ] | |
| 2.1.12 | Migration: providers | [ ] | |
| 2.1.13 | Migration: services | [ ] | |
| 2.1.14 | Migration: resources | [ ] | |
| 2.1.15 | Migration: schedules | [ ] | |
| 2.1.16 | Migration: slots | [ ] | |
| 2.1.17 | Migration: bookings | [ ] | |
| 2.1.18 | Migration: webhooks | [ ] | |
| 2.1.19 | Migration: api_keys | [ ] | |
| 2.1.20 | Migration: federation_peers | [ ] | |
| 2.1.21 | Performance indeksi | [ ] | |
| 2.1.22 | Seed skripta | [ ] | |

### 2.2 Aplikaciona struktura [0/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.2.1 | Fastify setup | [ ] | |
| 2.2.2 | CORS konfiguracija | [ ] | |
| 2.2.3 | Request validation (Zod) | [ ] | |
| 2.2.4 | Error handling middleware | [ ] | |
| 2.2.5 | Request ID tracking | [ ] | |
| 2.2.6 | Rate limiting middleware | [ ] | |
| 2.2.7 | Graceful shutdown + API versioning | [ ] | |

### 2.3 Core moduli [0/36]

#### Provider modul [0/5]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.1 | Provider CRUD servis | [ ] | |
| 2.3.2 | Provider validacija | [ ] | |
| 2.3.3 | Provider API rute | [ ] | |
| 2.3.4 | Provider unit testovi | [ ] | |
| 2.3.5 | Provider integration testovi | [ ] | |

#### Service modul [0/6]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.6 | Service CRUD servis | [ ] | |
| 2.3.7 | Service validacija | [ ] | |
| 2.3.8 | Service API rute | [ ] | |
| 2.3.9 | Service filtriranje i pretraga | [ ] | |
| 2.3.10 | Service unit testovi | [ ] | |
| 2.3.11 | Service integration testovi | [ ] | |

#### Resource modul [0/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.12 | Resource CRUD servis | [ ] | |
| 2.3.13 | Resource-service vezivanje | [ ] | |
| 2.3.14 | Resource API rute | [ ] | |
| 2.3.15 | Resource testovi | [ ] | |

#### Schedule modul [0/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.16 | Schedule servis | [ ] | |
| 2.3.17 | Recurring rules engine | [ ] | |
| 2.3.18 | Exception handling | [ ] | |
| 2.3.19 | Timezone conversion | [ ] | |
| 2.3.20 | Schedule API rute | [ ] | |
| 2.3.21 | Slot generation testovi | [ ] | |
| 2.3.22 | Schedule integration testovi | [ ] | |

#### Slot modul [0/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.23 | Slot generation servis | [ ] | |
| 2.3.24 | Slot query servis | [ ] | |
| 2.3.25 | Slot hold (Redis TTL) | [ ] | |
| 2.3.26 | Slot conflict detection | [ ] | |
| 2.3.27 | Slot API rute | [ ] | |
| 2.3.28 | Slot unit testovi | [ ] | |
| 2.3.29 | Slot integration testovi | [ ] | |

#### Booking modul [0/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.3.30 | Booking creation servis | [ ] | |
| 2.3.31 | Booking state machine | [ ] | |
| 2.3.32 | Optimistic locking | [ ] | |
| 2.3.33 | Cancellation policy | [ ] | |
| 2.3.34 | Booking query servis | [ ] | |
| 2.3.35 | Booking API rute | [ ] | |
| 2.3.36 | Booking testovi (unit + integration + e2e) | [ ] | |

### 2.4 Auth [0/11]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.4.1 | API key generation | [ ] | |
| 2.4.2 | API key validation middleware | [ ] | |
| 2.4.3 | API key scopes | [ ] | |
| 2.4.4 | API key rotation | [ ] | |
| 2.4.5 | API key testovi | [ ] | |
| 2.4.6 | OAuth2 authorization code flow | [ ] | |
| 2.4.7 | JWT token issuance | [ ] | |
| 2.4.8 | Token refresh + revocation | [ ] | |
| 2.4.9 | PKCE | [ ] | |
| 2.4.10 | RBAC (role definicije + middleware) | [ ] | |
| 2.4.11 | Auth testovi | [ ] | |

### 2.5 Webhooks [0/6]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.5.1 | Webhook registration API | [ ] | |
| 2.5.2 | Event emitter | [ ] | |
| 2.5.3 | Delivery servis (retry) | [ ] | |
| 2.5.4 | HMAC-SHA256 signature | [ ] | |
| 2.5.5 | Delivery log | [ ] | |
| 2.5.6 | Webhook testovi | [ ] | |

### 2.6 Federation [0/12]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.6.1 | `.well-known/obp` endpoint | [ ] | |
| 2.6.2 | WebFinger discovery | [ ] | |
| 2.6.3 | Peer registration API | [ ] | |
| 2.6.4 | Public key management | [ ] | |
| 2.6.5 | Discovery testovi | [ ] | |
| 2.6.6 | HTTP Signature signing/verify | [ ] | |
| 2.6.7 | Federated search | [ ] | |
| 2.6.8 | Federated slot query | [ ] | |
| 2.6.9 | Federated booking create/cancel | [ ] | |
| 2.6.10 | Inbox/outbox pattern | [ ] | |
| 2.6.11 | Catalog sync (periodic + diff) | [ ] | |
| 2.6.12 | Federation integration testovi (2 servera) | [ ] | |

### 2.7 Dodatne funkcionalnosti [0/9]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 2.7.1 | iCal feed export | [ ] | |
| 2.7.2 | iCal import | [ ] | |
| 2.7.3 | CalDAV kompatibilnost | [ ] | |
| 2.7.4 | Email notifikacije | [ ] | |
| 2.7.5 | Email template sistem | [ ] | |
| 2.7.6 | SMTP konfiguracija | [ ] | |
| 2.7.7 | Basic analytics servis | [ ] | |
| 2.7.8 | Analytics API | [ ] | |
| 2.7.9 | Admin API (stats, moderation) | [ ] | |

---

## FAZA 3 — Reference frontend [0/53]

### 3.1 Frontend setup [0/12]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.1.1 | Next.js init (App Router, TS) | [ ] | |
| 3.1.2 | Tailwind CSS setup | [ ] | |
| 3.1.3 | shadcn/ui setup | [ ] | |
| 3.1.4 | ESLint + Prettier | [ ] | |
| 3.1.5 | Folder struktura | [ ] | |
| 3.1.6 | OBP API client (generisan iz OpenAPI) | [ ] | |
| 3.1.7 | Environment varijable | [ ] | |
| 3.1.8 | Docker konfiguracija | [ ] | |
| 3.1.9 | Color palette + tipografija | [ ] | |
| 3.1.10 | Base UI komponente | [ ] | |
| 3.1.11 | Layout komponente | [ ] | |
| 3.1.12 | Dark mode + responsive | [ ] | |

### 3.2 Javni booking UI [0/14]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.2.1 | Home page (search, kategorije) | [ ] | |
| 3.2.2 | Search results page | [ ] | |
| 3.2.3 | Provider profile page | [ ] | |
| 3.2.4 | Service detail page | [ ] | |
| 3.2.5 | SSR za SEO | [ ] | |
| 3.2.6 | Kalendar komponenta | [ ] | |
| 3.2.7 | Time slot picker | [ ] | |
| 3.2.8 | Booking form | [ ] | |
| 3.2.9 | Booking confirmation page | [ ] | |
| 3.2.10 | Slot hold countdown | [ ] | |
| 3.2.11 | Booking success + iCal download | [ ] | |
| 3.2.12 | Booking status check page | [ ] | |
| 3.2.13 | Booking cancellation page | [ ] | |
| 3.2.14 | Booking flow e2e testovi | [ ] | |

### 3.3 Federated search UI [0/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.3.1 | Federated search results | [ ] | |
| 3.3.2 | Server badge/indicator | [ ] | |
| 3.3.3 | Cross-server booking flow | [ ] | |

### 3.4 Provider dashboard [0/20]

#### Auth [0/5]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.4.1 | Login stranica | [ ] | |
| 3.4.2 | Registracija provajdera | [ ] | |
| 3.4.3 | OAuth2 flow | [ ] | |
| 3.4.4 | Session management | [ ] | |
| 3.4.5 | Logout | [ ] | |

#### Provider management [0/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.4.6 | Edit provider info | [ ] | |
| 3.4.7 | Logo upload | [ ] | |
| 3.4.8 | Business hours editor | [ ] | |
| 3.4.9 | Holiday/exception management | [ ] | |

#### Service management [0/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.4.10 | Service list view | [ ] | |
| 3.4.11 | Add/edit service form | [ ] | |
| 3.4.12 | Service activation toggle | [ ] | |
| 3.4.13 | Service ordering | [ ] | |

#### Booking management [0/6]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.4.14 | Booking calendar view | [ ] | |
| 3.4.15 | Booking list view | [ ] | |
| 3.4.16 | Booking detail view | [ ] | |
| 3.4.17 | Confirm/cancel/complete akcije | [ ] | |
| 3.4.18 | Manual booking creation | [ ] | |
| 3.4.19 | Drag-and-drop rescheduling | [ ] | |

#### Analytics [0/1]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.4.20 | Dashboard overview + grafikoni | [ ] | |

### 3.5 Admin panel [0/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.5.1 | Admin login | [ ] | |
| 3.5.2 | Server stats dashboard | [ ] | |
| 3.5.3 | Provider management (approve/suspend) | [ ] | |
| 3.5.4 | Federation peer management | [ ] | |

### 3.6 Accessibility i i18n [0/5]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 3.6.1 | ARIA + keyboard navigation | [ ] | |
| 3.6.2 | Screen reader podrska | [ ] | |
| 3.6.3 | Accessibility testovi (axe, Lighthouse) | [ ] | |
| 3.6.4 | i18n framework (next-intl) | [ ] | |
| 3.6.5 | Prevod: engleski + srpski | [ ] | |

---

## FAZA 4 — SDK, docs, finalizacija [0/47]

### 4.1 JavaScript/TypeScript SDK [0/6]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.1.1 | Generisati TS tipove iz OpenAPI | [ ] | |
| 4.1.2 | OBP client klasa | [ ] | |
| 4.1.3 | Error handling + retry | [ ] | |
| 4.1.4 | Primeri koriscenja | [ ] | |
| 4.1.5 | Unit testovi | [ ] | |
| 4.1.6 | npm publish `@obp/client` | [ ] | |

### 4.2 Python SDK [0/4]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.2.1 | Python tipovi iz OpenAPI | [ ] | |
| 4.2.2 | Python client klasa | [ ] | |
| 4.2.3 | Primeri + testovi | [ ] | |
| 4.2.4 | PyPI publish `obp-client` | [ ] | |

### 4.3 Alati [0/3]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.3.1 | OBP Validator (compliance checker) | [ ] | |
| 4.3.2 | Validator CLI | [ ] | |
| 4.3.3 | `create-obp-server` scaffold | [ ] | |

### 4.4 Dokumentacija [0/12]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.4.1 | Docs sajt setup (VitePress) | [ ] | |
| 4.4.2 | Getting Started guide | [ ] | |
| 4.4.3 | Quick Start tutorial | [ ] | |
| 4.4.4 | API Reference | [ ] | |
| 4.4.5 | Federation Guide | [ ] | |
| 4.4.6 | Self-Hosting Guide | [ ] | |
| 4.4.7 | SDK dokumentacija | [ ] | |
| 4.4.8 | Security Best Practices | [ ] | |
| 4.4.9 | Tutorial: Frizerski salon | [ ] | |
| 4.4.10 | Tutorial: Sportski centar | [ ] | |
| 4.4.11 | Tutorial: Integracija sa sajtom | [ ] | |
| 4.4.12 | Tutorial: Federacija dva servera | [ ] | |

### 4.5 Testiranje i kvalitet [0/8]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.5.1 | Svi unit testovi prolaze | [ ] | |
| 4.5.2 | Svi integration testovi prolaze | [ ] | |
| 4.5.3 | E2E testovi (Playwright) | [ ] | |
| 4.5.4 | Load testing (k6) | [ ] | |
| 4.5.5 | Performance fix-ovi | [ ] | |
| 4.5.6 | Coverage >80% | [ ] | |
| 4.5.7 | OWASP ZAP scan | [ ] | |
| 4.5.8 | Dependency vulnerability scan | [ ] | |

### 4.6 Deployment [0/7]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.6.1 | Docker finalizacija (multi-stage) | [ ] | |
| 4.6.2 | docker-compose production | [ ] | |
| 4.6.3 | docker-compose development | [ ] | |
| 4.6.4 | CI/CD (lint + test + build) | [ ] | |
| 4.6.5 | Auto npm publish | [ ] | |
| 4.6.6 | Demo deploy (2 federated servera) | [ ] | |
| 4.6.7 | Lokalni dev setup skripta | [ ] | |

### 4.7 NLnet Grant Proposal [0/9]

| # | Task | Status | Napomena |
|---|------|--------|----------|
| 4.7.1 | Problem Statement | [ ] | |
| 4.7.2 | Project Description | [ ] | |
| 4.7.3 | Technical Approach | [ ] | |
| 4.7.4 | Milestones + deliverables | [ ] | |
| 4.7.5 | Budget breakdown | [ ] | |
| 4.7.6 | Team description | [ ] | |
| 4.7.7 | Relevance za NLnet/NGI Zero | [ ] | |
| 4.7.8 | Demo video (2-3 min) | [ ] | |
| 4.7.9 | Submit proposal | [ ] | |

---

## Statistika po fazama

| Faza | Taskovi | Zavrseno | Procenat |
|------|---------|----------|----------|
| Faza 0 — Priprema | 23 | 0 | 0% |
| Faza 1 — Specifikacija | 67 | 0 | 0% |
| Faza 2 — Server | 96 | 0 | 0% |
| Faza 3 — Frontend | 53 | 0 | 0% |
| Faza 4 — SDK/Docs/Final | 49 | 0 | 0% |
| **UKUPNO** | **288** | **0** | **0%** |