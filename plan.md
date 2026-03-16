# OpenBooking Protocol (OBP) — Plan izrade

## Vizija projekta

OpenBooking Protocol (OBP) je otvoreni, decentralizovani standard za online rezervacije. Cilj je da zameni zatvorene booking platforme (Calendly, Fresha, Booksy, Treatwell...) otvorenim protokolom koji omogucava interoperabilnost izmedju booking servera — slicno kao sto email protokol omogucava komunikaciju izmedju razlicitih email provajdera.

**Grant cilj:** NLnet NGI Zero — €35,000
**Trajanje:** 4 meseca
**Licenca:** AGPL-3.0 (server), MIT (spec, klijent biblioteke)

---

## Arhitektura sistema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend    │     │  Frontend    │     │  Frontend    │
│  (Next.js)  │     │  (bilo koji) │     │  (mobile)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  OBP Server │◄───►│  OBP Server │◄───►│  OBP Server │
│  (Salon A)  │     │  (Salon B)  │     │  (Doktor C) │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PostgreSQL │     │  PostgreSQL │     │  PostgreSQL │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Federacija:** Serveri komuniciraju medjusobno preko OBP Federation protokola (HTTP + JSON-LD + potpisi).

---

## FAZA 0 — Priprema projekta (Nedelja 1)

### 0.1 Inicijalizacija repozitorijuma
- [ ] Kreirati GitHub organizaciju `openbooking-protocol`
- [ ] Kreirati glavni repozitorijum `obp` (monorepo)
- [ ] Definisati strukturu direktorijuma:
  ```
  obp/
  ├── spec/           # Specifikacija protokola
  ├── server/         # Reference server implementacija
  ├── frontend/       # Reference frontend aplikacija
  ├── sdk/            # Klijentske biblioteke
  ├── docs/           # Dokumentacija
  ├── examples/       # Primeri integracije
  └── tools/          # Pomocni alati (validatori, generatori)
  ```
- [ ] Dodati `.gitignore` (Node, env, IDE fajlovi)
- [ ] Dodati `LICENSE` fajl (AGPL-3.0)
- [ ] Kreirati pocetni `README.md` sa opisom projekta
- [ ] Dodati `CONTRIBUTING.md` (uputstvo za kontributore)
- [ ] Dodati `CODE_OF_CONDUCT.md`
- [ ] Postaviti GitHub Issues template (bug, feature, RFC)
- [ ] Postaviti GitHub Pull Request template
- [ ] Konfigurisati GitHub Actions za CI/CD

### 0.2 Definisanje tech stack-a
- [ ] Server: Node.js (TypeScript) + Express/Fastify
- [ ] Baza: PostgreSQL 15+
- [ ] Cache: Redis
- [ ] Frontend: Next.js 14+ (App Router, TypeScript)
- [ ] Specifikacija: OpenAPI 3.1 (YAML)
- [ ] Testiranje: Vitest (server), Playwright (frontend)
- [ ] Dokumentacija: Docusaurus ili VitePress
- [ ] Kontejnerizacija: Docker + Docker Compose

### 0.3 Projektna dokumentacija
- [ ] Napisati Project Charter dokument (cilj, scope, non-goals)
- [ ] Definisati glossary pojmova (Provider, Service, Slot, Booking, Federation...)
- [ ] Napisati Architecture Decision Records (ADR) template
- [ ] Kreirati ROADMAP.md sa milestone-ovima

---

## FAZA 1 — Specifikacija protokola (Nedelje 2-3)

### 1.1 Definisanje core entiteta

#### 1.1.1 Provider (Pruzalac usluga)
- [ ] Definisati Provider schema:
  - `id` (UUID)
  - `name` (string)
  - `description` (string)
  - `category` (enum: health, beauty, sport, education, professional, other)
  - `location` (GeoJSON Point + address object)
  - `timezone` (IANA timezone)
  - `contact` (email, phone, website)
  - `logo_url` (string, opciono)
  - `metadata` (key-value, prosirivo)
  - `federation_url` (URL za federaciju)
  - `public_key` (za potpisivanje poruka)
  - `created_at`, `updated_at` (timestamps)
- [ ] Definisati Provider validaciona pravila
- [ ] Napisati primere Provider objekata (frizer, doktor, sportski centar)

#### 1.1.2 Service (Usluga)
- [ ] Definisati Service schema:
  - `id` (UUID)
  - `provider_id` (FK)
  - `name` (string)
  - `description` (string)
  - `duration_minutes` (integer)
  - `buffer_before_minutes` (integer, default 0)
  - `buffer_after_minutes` (integer, default 0)
  - `price` (object: amount, currency ISO 4217)
  - `max_participants` (integer, default 1 — za grupne aktivnosti)
  - `requires_confirmation` (boolean)
  - `cancellation_policy` (object: deadline_hours, fee)
  - `tags` (string array)
  - `active` (boolean)
  - `metadata` (key-value)
- [ ] Definisati Service kategorije i pod-kategorije
- [ ] Napisati primere Service objekata

#### 1.1.3 Resource (Resurs)
- [ ] Definisati Resource schema:
  - `id` (UUID)
  - `provider_id` (FK)
  - `type` (enum: staff, room, equipment)
  - `name` (string)
  - `services` (array of service_id — koje usluge moze da pruza)
  - `availability_schedule` (recurring schedule object)
  - `active` (boolean)
- [ ] Definisati kako se resursi vezuju za usluge
- [ ] Napisati primere (frizer Marko, soba 1, padel teren 2)

#### 1.1.4 Slot (Slobodan termin)
- [ ] Definisati Slot schema:
  - `id` (UUID)
  - `service_id` (FK)
  - `resource_id` (FK, opciono)
  - `start_time` (ISO 8601 datetime)
  - `end_time` (ISO 8601 datetime)
  - `status` (enum: available, held, booked, blocked)
  - `remaining_capacity` (integer)
  - `price_override` (opciono — za dinamicko cene)
- [ ] Definisati slot generation logiku (kako se generisu slotovi iz rasporeda)
- [ ] Definisati slot hold mehanizam (privremeno drzanje dok korisnik potvrdi)
- [ ] Definisati conflict resolution pravila (sta ako dva korisnika biraju isti slot)

#### 1.1.5 Booking (Rezervacija)
- [ ] Definisati Booking schema:
  - `id` (UUID)
  - `slot_id` (FK)
  - `service_id` (FK)
  - `provider_id` (FK)
  - `customer` (object: name, email, phone — minimalni podaci)
  - `status` (enum: pending, confirmed, cancelled, completed, no_show)
  - `notes` (string, opciono)
  - `source` (enum: direct, federated, api)
  - `source_server` (URL ako je federated)
  - `created_at`, `updated_at`
  - `cancelled_at` (opciono)
  - `cancellation_reason` (opciono)
- [ ] Definisati booking lifecycle (state machine):
  ```
  pending → confirmed → completed
  pending → cancelled
  confirmed → cancelled
  confirmed → no_show
  ```
- [ ] Definisati booking validaciona pravila
- [ ] Napisati primere Booking objekata

#### 1.1.6 Schedule (Raspored rada)
- [ ] Definisati Schedule schema:
  - `provider_id` (FK)
  - `resource_id` (FK, opciono)
  - `recurring_rules` (array of rules):
    - `day_of_week` (0-6)
    - `start_time` (HH:mm)
    - `end_time` (HH:mm)
  - `exceptions` (array of date overrides):
    - `date` (YYYY-MM-DD)
    - `available` (boolean)
    - `start_time`, `end_time` (opciono)
  - `effective_from`, `effective_until` (date range)
- [ ] Definisati pravila za generisanje slotova iz rasporeda
- [ ] Definisati timezone handling pravila

### 1.2 Definisanje API specifikacije (OpenAPI)

#### 1.2.1 Discovery endpoints
- [ ] `GET /.well-known/obp` — server metadata i capabilities
- [ ] `GET /obp/v1/providers` — lista provajdera na serveru
- [ ] `GET /obp/v1/providers/{id}` — detalji provajdera
- [ ] `GET /obp/v1/categories` — podrzane kategorije

#### 1.2.2 Service endpoints
- [ ] `GET /obp/v1/services` — lista usluga (filteri: provider_id, category, tag)
- [ ] `GET /obp/v1/services/{id}` — detalji usluge

#### 1.2.3 Availability endpoints
- [ ] `GET /obp/v1/slots` — slobodni slotovi (filteri: service_id, date_from, date_to, resource_id)
- [ ] `GET /obp/v1/slots/{id}` — detalji slota
- [ ] `POST /obp/v1/slots/{id}/hold` — privremeno drzi slot (5 min)

#### 1.2.4 Booking endpoints
- [ ] `POST /obp/v1/bookings` — kreiraj rezervaciju
- [ ] `GET /obp/v1/bookings/{id}` — status rezervacije
- [ ] `POST /obp/v1/bookings/{id}/confirm` — potvrdi rezervaciju
- [ ] `POST /obp/v1/bookings/{id}/cancel` — otkazi rezervaciju

#### 1.2.5 Provider management endpoints (zahteva auth)
- [ ] `POST /obp/v1/providers` — registruj provajdera
- [ ] `PUT /obp/v1/providers/{id}` — azuriraj provajdera
- [ ] `POST /obp/v1/services` — dodaj uslugu
- [ ] `PUT /obp/v1/services/{id}` — azuriraj uslugu
- [ ] `DELETE /obp/v1/services/{id}` — ukloni uslugu
- [ ] `PUT /obp/v1/schedule` — postavi raspored
- [ ] `GET /obp/v1/bookings` — lista rezervacija (filteri: status, date_from, date_to)
- [ ] `POST /obp/v1/bookings/{id}/complete` — oznaci kao zavrseno
- [ ] `POST /obp/v1/bookings/{id}/no-show` — oznaci kao no-show

#### 1.2.6 Webhook/Notification endpoints
- [ ] `POST /obp/v1/webhooks` — registruj webhook
- [ ] `DELETE /obp/v1/webhooks/{id}` — ukloni webhook
- [ ] Definisati webhook event tipove:
  - `booking.created`
  - `booking.confirmed`
  - `booking.cancelled`
  - `booking.completed`
  - `slot.held`
  - `slot.released`

#### 1.2.7 Pisanje OpenAPI specifikacije
- [ ] Napisati kompletnu OpenAPI 3.1 YAML specifikaciju
- [ ] Definisati sve request/response schemas
- [ ] Definisati error response format (RFC 7807 Problem Details)
- [ ] Definisati paginaciju (cursor-based)
- [ ] Definisati rate limiting headers
- [ ] Definisati autentifikaciju (API key + OAuth2)
- [ ] Validirati specifikaciju alatom (spectral ili redocly)
- [ ] Generisati interaktivnu dokumentaciju (Swagger UI / Redoc)

### 1.3 Definisanje Federation protokola

#### 1.3.1 Server-to-Server komunikacija
- [ ] Definisati discovery mehanizam (WebFinger + `.well-known/obp`)
- [ ] Definisati server registration flow
- [ ] Definisati HTTP Signatures za autentifikaciju izmedju servera
- [ ] Definisati format federated poruka (JSON-LD)

#### 1.3.2 Federated operacije
- [ ] `federation/search` — pretraga usluga na remote serveru
- [ ] `federation/slots` — preuzimanje slobodnih termina sa remote servera
- [ ] `federation/book` — kreiranje rezervacije na remote serveru
- [ ] `federation/cancel` — otkazivanje federated rezervacije
- [ ] `federation/sync` — sinhronizacija provider kataloga

#### 1.3.3 Trust i security model
- [ ] Definisati server trust levels (open, verified, trusted)
- [ ] Definisati rate limiting za federation
- [ ] Definisati data minimization pravila (koji podaci se dele)
- [ ] Definisati abuse prevention mehanizme

### 1.4 Pisanje specifikacije dokumenta
- [ ] Napisati `spec/protocol.md` — glavni dokument protokola
- [ ] Napisati `spec/entities.md` — detaljan opis svih entiteta
- [ ] Napisati `spec/api.md` — API reference
- [ ] Napisati `spec/federation.md` — federation protokol
- [ ] Napisati `spec/security.md` — security model
- [ ] Napisati `spec/extensions.md` — mehanizam za prosirenja
- [ ] Peer review specifikacije (GitHub Discussions)

---

## FAZA 2 — Reference server implementacija (Nedelje 4-9)

### 2.1 Inicijalizacija server projekta (Nedelja 4)

#### 2.1.1 Projekt setup
- [ ] Inicijalizovati Node.js projekat sa TypeScript
- [ ] Konfigurisati `tsconfig.json` (strict mode)
- [ ] Konfigurisati ESLint + Prettier
- [ ] Konfigurisati Vitest za testiranje
- [ ] Dodati `Dockerfile` i `docker-compose.yml` (app + PostgreSQL + Redis)
- [ ] Konfigurisati environment varijable (.env.example)
- [ ] Postaviti logging (pino)
- [ ] Postaviti health check endpoint

#### 2.1.2 Baza podataka
- [ ] Odabrati ORM/query builder (Drizzle ORM ili Kysely)
- [ ] Konfigurisati database connection pool
- [ ] Kreirati migration sistem
- [ ] Napisati inicijalnu migraciju — `providers` tabela
- [ ] Napisati migraciju — `services` tabela
- [ ] Napisati migraciju — `resources` tabela
- [ ] Napisati migraciju — `schedules` tabela
- [ ] Napisati migraciju — `slots` tabela
- [ ] Napisati migraciju — `bookings` tabela
- [ ] Napisati migraciju — `webhooks` tabela
- [ ] Napisati migraciju — `api_keys` tabela
- [ ] Napisati migraciju — `federation_peers` tabela
- [ ] Dodati indekse za performanse (slots po datumu, bookings po statusu)
- [ ] Napisati seed skriptu sa test podacima

#### 2.1.3 Osnovna aplikaciona struktura
- [ ] Postaviti HTTP framework (Fastify)
- [ ] Konfigurisati CORS
- [ ] Konfigurisati request validation (Zod ili AJV iz OpenAPI)
- [ ] Postaviti error handling middleware
- [ ] Postaviti request ID tracking
- [ ] Postaviti rate limiting middleware
- [ ] Konfigurisati graceful shutdown
- [ ] Postaviti API versioning (/obp/v1/)

### 2.2 Core business logika (Nedelje 5-6)

#### 2.2.1 Provider modul
- [ ] Implementirati Provider CRUD servis
- [ ] Implementirati Provider validaciju
- [ ] Implementirati Provider API rute (GET, POST, PUT)
- [ ] Napisati unit testove za Provider servis
- [ ] Napisati integration testove za Provider API

#### 2.2.2 Service modul
- [ ] Implementirati Service CRUD servis
- [ ] Implementirati Service validaciju (duration, price, categorija)
- [ ] Implementirati Service API rute
- [ ] Implementirati filtriranje i pretragu usluga
- [ ] Napisati unit testove za Service servis
- [ ] Napisati integration testove za Service API

#### 2.2.3 Resource modul
- [ ] Implementirati Resource CRUD servis
- [ ] Implementirati vezivanje resursa za usluge
- [ ] Implementirati Resource API rute
- [ ] Napisati unit testove za Resource servis
- [ ] Napisati integration testove za Resource API

#### 2.2.4 Schedule modul
- [ ] Implementirati Schedule servis
- [ ] Implementirati recurring rules engine (generisanje slotova)
- [ ] Implementirati exception handling (praznici, izuzeci)
- [ ] Implementirati timezone conversion logiku
- [ ] Implementirati Schedule API rute
- [ ] Napisati unit testove za slot generation
- [ ] Napisati unit testove za timezone handling
- [ ] Napisati integration testove za Schedule API

#### 2.2.5 Slot modul
- [ ] Implementirati Slot generation servis (iz Schedule-a)
- [ ] Implementirati Slot query servis (filtriranje po datumu, usluzi, resursu)
- [ ] Implementirati Slot hold mehanizam (Redis TTL)
- [ ] Implementirati Slot conflict detection
- [ ] Implementirati Slot API rute
- [ ] Napisati unit testove za Slot servis
- [ ] Napisati unit testove za conflict detection
- [ ] Napisati integration testove za Slot API

#### 2.2.6 Booking modul
- [ ] Implementirati Booking creation servis
- [ ] Implementirati Booking state machine (pending → confirmed → completed/cancelled)
- [ ] Implementirati optimistic locking za concurrent bookings
- [ ] Implementirati cancellation policy enforcement
- [ ] Implementirati Booking query servis (filtriranje, paginacija)
- [ ] Implementirati Booking API rute
- [ ] Napisati unit testove za Booking state machine
- [ ] Napisati unit testove za concurrent booking handling
- [ ] Napisati integration testove za Booking API
- [ ] Napisati end-to-end test: pun booking flow (search → hold → book → confirm → complete)

### 2.3 Autentifikacija i autorizacija (Nedelja 7)

#### 2.3.1 API Key autentifikacija
- [ ] Implementirati API key generation
- [ ] Implementirati API key validation middleware
- [ ] Implementirati API key scopes (read, write, admin)
- [ ] Implementirati API key rotation
- [ ] Napisati testove za API key auth

#### 2.3.2 OAuth2 (za frontend)
- [ ] Implementirati OAuth2 authorization code flow
- [ ] Implementirati token issuance (JWT)
- [ ] Implementirati token refresh
- [ ] Implementirati token revocation
- [ ] Konfigurisati PKCE za public klijente
- [ ] Napisati testove za OAuth2 flow

#### 2.3.3 Role-based access control
- [ ] Definisati role (admin, provider_owner, staff, customer)
- [ ] Implementirati permission middleware
- [ ] Implementirati resource ownership checks
- [ ] Napisati testove za RBAC

### 2.4 Webhook sistem (Nedelja 7)

- [ ] Implementirati webhook registration API
- [ ] Implementirati event emitter za booking dogadjaje
- [ ] Implementirati webhook delivery servis (sa retry logikom)
- [ ] Implementirati webhook signature verification (HMAC-SHA256)
- [ ] Implementirati webhook delivery log
- [ ] Napisati testove za webhook sistem

### 2.5 Federation implementacija (Nedelja 8)

#### 2.5.1 Server discovery
- [ ] Implementirati `.well-known/obp` endpoint
- [ ] Implementirati WebFinger za server discovery
- [ ] Implementirati peer registration API
- [ ] Implementirati server public key management
- [ ] Napisati testove za discovery

#### 2.5.2 Federated operacije
- [ ] Implementirati HTTP Signature signing/verification
- [ ] Implementirati federated search (pretraga na remote serveru)
- [ ] Implementirati federated slot query
- [ ] Implementirati federated booking creation
- [ ] Implementirati federated booking cancellation
- [ ] Implementirati inbox/outbox pattern za asinhronu komunikaciju
- [ ] Napisati integration testove sa dva servera (docker-compose)

#### 2.5.3 Catalog sync
- [ ] Implementirati periodicni sync provajder kataloga
- [ ] Implementirati diff-based sync (samo promene)
- [ ] Implementirati cache za remote podatke (Redis)
- [ ] Napisati testove za catalog sync

### 2.6 Dodatne server funkcionalnosti (Nedelja 9)

#### 2.6.1 iCal/CalDAV integracija
- [ ] Implementirati iCal feed export (za bookinge)
- [ ] Implementirati iCal import (za blokirane termine)
- [ ] Implementirati CalDAV server kompatibilnost
- [ ] Napisati testove za iCal/CalDAV

#### 2.6.2 Notifikacije
- [ ] Implementirati email notifikacije (booking confirmation, reminder, cancellation)
- [ ] Implementirati email template sistem
- [ ] Konfigurisati SMTP/transactional email provider
- [ ] Napisati testove za notifikacije

#### 2.6.3 Analytics i reporting
- [ ] Implementirati basic analytics (bookings po danu, no-show rate, popular services)
- [ ] Implementirati analytics API endpoint
- [ ] Napisati testove za analytics

#### 2.6.4 Admin API
- [ ] Implementirati server admin endpoints (server stats, peer management)
- [ ] Implementirati moderation alate (block peer, block user)
- [ ] Napisati testove za admin API

---

## FAZA 3 — Reference frontend (Nedelje 10-13)

### 3.1 Frontend setup (Nedelja 10)

#### 3.1.1 Projekt inicijalizacija
- [ ] Inicijalizovati Next.js 14+ projekat (App Router, TypeScript)
- [ ] Konfigurisati Tailwind CSS
- [ ] Konfigurisati shadcn/ui komponentnu biblioteku
- [ ] Konfigurisati ESLint + Prettier
- [ ] Postaviti folder strukturu:
  ```
  frontend/
  ├── app/
  │   ├── (public)/        # Javne stranice (search, booking)
  │   ├── (dashboard)/     # Provider dashboard
  │   └── (admin)/         # Server admin
  ├── components/
  │   ├── ui/              # Base UI komponente
  │   ├── booking/         # Booking-related komponente
  │   └── dashboard/       # Dashboard komponente
  ├── lib/
  │   ├── api/             # API client
  │   └── utils/           # Helper funkcije
  └── hooks/               # Custom React hooks
  ```
- [ ] Kreirati OBP API client (TypeScript, generisan iz OpenAPI spec)
- [ ] Konfigurisati environment varijable
- [ ] Postaviti Docker konfiguraciju za frontend

#### 3.1.2 Design sistem
- [ ] Definisati color palette i tipografiju
- [ ] Kreirati base UI komponente (Button, Input, Card, Modal, Toast)
- [ ] Kreirati layout komponente (Header, Footer, Sidebar, PageContainer)
- [ ] Implementirati responsive design breakpoints
- [ ] Implementirati dark mode podrsku
- [ ] Kreirati loading i error state komponente

### 3.2 Javni booking interfejs (Nedelja 11)

#### 3.2.1 Service discovery stranice
- [ ] Implementirati home page (search bar, kategorije, featured provajderi)
- [ ] Implementirati search results page (filteri: kategorija, lokacija, cena)
- [ ] Implementirati provider profile page (info, usluge, recenzije)
- [ ] Implementirati service detail page (opis, cena, duration, dostupnost)
- [ ] Implementirati server-side rendering za SEO
- [ ] Napisati testove za search i discovery

#### 3.2.2 Booking flow
- [ ] Implementirati kalendar komponentu za izbor datuma
- [ ] Implementirati time slot picker (prikaz slobodnih termina)
- [ ] Implementirati booking form (customer info: ime, email, telefon, napomena)
- [ ] Implementirati booking confirmation page
- [ ] Implementirati slot hold indikator (countdown timer)
- [ ] Implementirati booking success page (sa detalijma + iCal download)
- [ ] Implementirati booking status check page (za korisnika)
- [ ] Implementirati booking cancellation page
- [ ] Napisati end-to-end testove za booking flow (Playwright)

#### 3.2.3 Federated search
- [ ] Implementirati federated search UI (rezultati sa vise servera)
- [ ] Implementirati server badge/indicator na rezultatima
- [ ] Implementirati federated booking flow (cross-server)
- [ ] Napisati testove za federated search

### 3.3 Provider dashboard (Nedelja 12)

#### 3.3.1 Autentifikacija
- [ ] Implementirati login stranicu
- [ ] Implementirati registraciju novog provajdera
- [ ] Implementirati OAuth2 flow sa serverom
- [ ] Implementirati session management
- [ ] Implementirati logout
- [ ] Napisati testove za auth flow

#### 3.3.2 Provider profil management
- [ ] Implementirati edit provider info (ime, opis, lokacija, kontakt)
- [ ] Implementirati logo upload
- [ ] Implementirati business hours setup (vizuelni editor)
- [ ] Implementirati holiday/exception management
- [ ] Napisati testove za profil management

#### 3.3.3 Service management
- [ ] Implementirati service list view
- [ ] Implementirati add/edit service form
- [ ] Implementirati service activation/deactivation
- [ ] Implementirati service ordering (redosled prikaza)
- [ ] Napisati testove za service management

#### 3.3.4 Resource management
- [ ] Implementirati resource list view (staff, rooms, equipment)
- [ ] Implementirati add/edit resource form
- [ ] Implementirati resource-service assignment
- [ ] Implementirati resource schedule editor
- [ ] Napisati testove za resource management

#### 3.3.5 Booking management
- [ ] Implementirati booking calendar view (dnevni, nedeljni, mesecni)
- [ ] Implementirati booking list view (sa filterima i pretragom)
- [ ] Implementirati booking detail view
- [ ] Implementirati confirm/cancel/complete booking akcije
- [ ] Implementirati manual booking creation (provider pravi za klijenta)
- [ ] Implementirati drag-and-drop rescheduling na kalendaru
- [ ] Napisati testove za booking management

#### 3.3.6 Dashboard analytics
- [ ] Implementirati dashboard overview (danas, ova nedelja, ovaj mesec)
- [ ] Implementirati booking statistike (grafikoni)
- [ ] Implementirati revenue overview
- [ ] Implementirati no-show tracking
- [ ] Napisati testove za analytics

### 3.4 Server admin panel (Nedelja 13)

#### 3.4.1 Admin UI
- [ ] Implementirati admin login (odvojeno od provider login)
- [ ] Implementirati server stats dashboard
- [ ] Implementirati provider management (list, approve, suspend)
- [ ] Implementirati federation peer management (list, add, remove, block)
- [ ] Implementirati server settings UI
- [ ] Napisati testove za admin panel

### 3.5 Accessibility i i18n (Nedelja 13)

- [ ] Implementirati ARIA atribute na sve interaktivne elemente
- [ ] Implementirati keyboard navigation
- [ ] Implementirati screen reader podrsku
- [ ] Testirati sa accessibility alatima (axe, Lighthouse)
- [ ] Postaviti i18n framework (next-intl)
- [ ] Prevesti UI na engleski (default) i srpski
- [ ] Napisati accessibility testove

---

## FAZA 4 — SDK, dokumentacija i finalizacija (Nedelje 14-16)

### 4.1 Klijentske biblioteke (SDK)

#### 4.1.1 JavaScript/TypeScript SDK
- [ ] Generisati TypeScript tipove iz OpenAPI specifikacije
- [ ] Implementirati OBP client klasu (fetch-based, zero dependencies)
- [ ] Implementirati error handling i retry logiku
- [ ] Implementirati TypeScript generics za tipiziran API
- [ ] Napisati primere koriscenja
- [ ] Napisati unit testove
- [ ] Objaviti na npm kao `@obp/client`

#### 4.1.2 Python SDK (opciono, ali povecava sanse za grant)
- [ ] Generisati Python tipove iz OpenAPI specifikacije
- [ ] Implementirati OBP client klasu
- [ ] Napisati primere koriscenja
- [ ] Napisati unit testove
- [ ] Objaviti na PyPI kao `obp-client`

### 4.2 Alati (Tools)

#### 4.2.1 OBP Validator
- [ ] Implementirati validator za OBP server compliance
- [ ] Validator provera da li server implementira sve required endpoints
- [ ] Validator provera response formate
- [ ] CLI interfejs: `npx @obp/validator https://example.com`
- [ ] Napisati testove za validator

#### 4.2.2 OBP Server scaffold
- [ ] Kreirati `create-obp-server` CLI alat
- [ ] Generator postavlja bazicni OBP server sa konfiguracijom
- [ ] Napisati testove za scaffold

### 4.3 Dokumentacija

#### 4.3.1 Tehnicka dokumentacija
- [ ] Postaviti dokumentacioni sajt (VitePress ili Docusaurus)
- [ ] Napisati Getting Started guide
- [ ] Napisati Quick Start tutorial (deploy OBP server za 10 minuta)
- [ ] Napisati API Reference (iz OpenAPI specifikacije)
- [ ] Napisati Federation Guide
- [ ] Napisati Self-Hosting Guide (Docker, VPS, cloud)
- [ ] Napisati SDK dokumentaciju (JS, Python)
- [ ] Napisati Security Best Practices guide

#### 4.3.2 Primeri i tutoriali
- [ ] Napisati tutorial: "Booking za frizerski salon"
- [ ] Napisati tutorial: "Booking za sportski centar"
- [ ] Napisati tutorial: "Integracija sa postojecim sajtom"
- [ ] Napisati tutorial: "Povezivanje dva OBP servera (federacija)"
- [ ] Kreirati example projekte u `examples/` direktorijumu

#### 4.3.3 Specifikacija dokumentacija
- [ ] Finalizovati spec/protocol.md
- [ ] Napisati verzionisanje specifikacije (SemVer)
- [ ] Napisati migration guide za buduce verzije

### 4.4 Testiranje i kvalitet

#### 4.4.1 Kompletno testiranje
- [ ] Pokrenuti sve unit testove i popraviti failove
- [ ] Pokrenuti sve integration testove
- [ ] Pokrenuti end-to-end testove (Playwright)
- [ ] Pokrenuti load testing (k6 ili autocannon)
- [ ] Identifikovati i popraviti performance bottleneck-ove
- [ ] Proveriti test coverage (cilj: >80%)

#### 4.4.2 Security audit priprema
- [ ] Pokrenuti OWASP ZAP scan
- [ ] Pokrenuti dependency vulnerability scan (npm audit)
- [ ] Proveriti SQL injection zastitu
- [ ] Proveriti XSS zastitu
- [ ] Proveriti CSRF zastitu
- [ ] Proveriti rate limiting
- [ ] Proveriti autentifikaciju i autorizaciju
- [ ] Dokumentovati security findings i fixes

### 4.5 Deployment i DevOps

#### 4.5.1 Docker
- [ ] Finalizovati Docker slike (multi-stage build)
- [ ] Optimizovati Docker image velicinu
- [ ] Kreirati docker-compose.yml za production
- [ ] Kreirati docker-compose.yml za development
- [ ] Dodati healthcheck-ove u Docker konfiguraciju

#### 4.5.2 CI/CD
- [ ] Konfigurisati GitHub Actions za lint + test na PR
- [ ] Konfigurisati GitHub Actions za build Docker slike
- [ ] Konfigurisati automatsko objavljivanje npm paketa
- [ ] Konfigurisati automatski deploy dokumentacije

#### 4.5.3 Demo deployment
- [ ] Deploy demo servera (2 instrance za prikaz federacije)
- [ ] Deploy demo frontenda
- [ ] Konfigurisati demo sa test podacima
- [ ] Napisati setup skriptu za brzi lokalni development

### 4.6 NLnet Grant Proposal

#### 4.6.1 Priprema proposal-a
- [ ] Napisati Problem Statement (zasto su zatvoreni booking sistemi problem)
- [ ] Napisati Project Description (sta je OBP i kako resi problem)
- [ ] Napisati Technical Approach (arhitektura, protokol, federacija)
- [ ] Napisati Milestones sa deliverables (5-8 milestones)
- [ ] Napisati Budget breakdown
- [ ] Napisati Team description
- [ ] Napisati Relevance za NLnet/NGI Zero ciljeve
- [ ] Review i finalizacija proposal-a
- [ ] Pripremiti demo video (2-3 minuta)
- [ ] Submit proposal pre deadline-a

---

## Rezime faza i timeline

| Faza | Opis | Trajanje | Budget |
|------|------|----------|--------|
| 0 | Priprema projekta | 1 nedelja | - |
| 1 | Specifikacija protokola | 2 nedelje | €8,000 |
| 2 | Reference server | 6 nedelja | €12,000 |
| 3 | Reference frontend | 4 nedelje | €8,000 |
| 4 | SDK, docs, finalizacija | 3 nedelje | €7,000 |
| **Total** | | **16 nedelja (4 meseca)** | **€35,000** |

---

## Rizici i mitigacije

| Rizik | Verovatnoca | Uticaj | Mitigacija |
|-------|-------------|--------|------------|
| Federation kompleksnost veca od ocekivane | Srednja | Visok | Poceti sa jednostavnom federacijom, prosiriti later |
| Slot conflict handling pod opterecenjem | Srednja | Srednji | Koristiti PostgreSQL advisory locks + Redis |
| Scope creep | Visoka | Srednji | Striktno pratiti MVP scope, koristiti task.md |
| Timezone bagovi | Visoka | Srednji | Koristiti libraries (date-fns-tz), opsezno testiranje |
| Security ranjivosti | Srednja | Visok | Security audit u Fazi 4, OWASP checklist |

---

## Principi razvoja

1. **Spec-first** — Svaka funkcionalnost se prvo definise u specifikaciji, pa tek onda implementira
2. **Test-driven** — Pisati testove pre ili tokom implementacije, ne posle
3. **Privacy by design** — Minimalni podaci, default privatnost
4. **Federation-ready** — Svaka odluka se razmatra kroz prizmu federacije
5. **Developer experience** — API mora biti jednostavan, dokumentacija jasna
6. **Incremental delivery** — Svaka faza mora biti upotrebljiva sama za sebe
7. **Git commit poruke** — Nikada ne pominjati AI agente, Claude, Anthropic, niti bilo koji alat za generisanje koda u commit porukama