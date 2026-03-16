# NLnet Foundation Grant Proposal
## NGI Zero Commons Fund — OpenBooking Protocol (OBP)

---

## 1. Problem Statement

The booking industry is dominated by closed, centralized platforms (Calendly, Acuity Scheduling, Booksy, Fresha, SimplyBook) that:

- **Trap providers** in vendor silos: switching platforms means losing booking history, customer data, and integrations
- **Fragment the discovery experience**: customers must visit separate apps for each type of service (health, beauty, sport, education)
- **Extract monopoly rents**: platforms charge 15–30% commission or high monthly SaaS fees, disproportionately burdening small independent businesses
- **Own the customer relationship**: providers cannot contact their own customers outside the platform's approval
- **Have no interoperability**: a booking made on Booksy cannot be seen, managed, or cancelled from any other tool

This is fundamentally a protocol problem, not a product problem. Just as email succeeded because SMTP is an open protocol (anyone can run a mail server and interoperate), and the web succeeded because HTTP is open, the booking ecosystem needs an open, federated protocol.

Small service businesses — the barber, the physio, the yoga teacher, the music tutor — deserve the same independence on the internet that they have in the physical world.

---

## 2. Project Description

**OpenBooking Protocol (OBP)** is an open, federated protocol for service discovery and appointment booking. It enables:

- **Any software** to interoperate: calendar apps, websites, mobile apps, and booking aggregators can all speak OBP
- **Any provider** to self-host their booking infrastructure or choose from competing OBP-compatible platforms — without lock-in
- **Cross-server booking**: customers on one OBP server can discover and book services from any other OBP server
- **Standardized flows**: slot discovery, holds, booking creation, cancellation, and webhooks follow a consistent protocol across all implementations

OBP is inspired by ActivityPub (W3C Recommendation, the backbone of Mastodon/Fediverse) — applying the same federation architecture to appointments.

### Deliverables

1. **Protocol specification** (machine-readable OpenAPI 3.1 + human-readable Markdown)
2. **Reference server implementation** (Node.js/TypeScript, MIT license)
3. **JavaScript/TypeScript SDK** (`@obp/client`, npm)
4. **Python SDK** (`obp-client`, PyPI)
5. **OBP Validator** (`@obp/validator` CLI, tests compliance)
6. **Scaffold tool** (`create-obp-server`, bootstraps new implementations)
7. **Documentation site** (VitePress, covering spec, guide, API reference, tutorials)
8. **Frontend reference app** (Next.js 14 demo showing end-to-end booking flow)

---

## 3. Technical Approach

### Protocol design

OBP follows REST principles with JSON over HTTPS. Key design decisions:

**Federated discovery**: Each server exposes `GET /.well-known/obp` with its public Ed25519 key, enabling other servers to discover and verify its identity — analogous to WebFinger.

**HTTP Signatures (RFC 9421)**: Server-to-server requests are authenticated cryptographically. No shared secrets; each server holds only its own private key. This enables trust without central coordination.

**Slot model**: Available slots are computed dynamically from schedule rules and existing bookings, not stored as static records. This eliminates the thundering herd problem when many clients query availability simultaneously.

**Two-phase booking**: A slot `hold` (temporary reservation, 10-minute TTL in Redis) prevents double-booking during checkout. Only a `hold_id` can create a booking — this enforces atomicity.

**RFC 7807 errors**: Standardized error format ensures clients can handle errors consistently across implementations.

**iCal (RFC 5545) export**: Every booking has an `.ics` endpoint, enabling interoperability with any calendar application.

### Implementation stack

The reference server uses:
- **Fastify** (Node.js HTTP framework, 2x faster than Express)
- **Drizzle ORM** + **PostgreSQL** (type-safe queries, migrations)
- **Redis** (slot holds, caching, session tokens)
- **Zod** (runtime validation)
- **Ed25519** (HTTP Signatures for federation)

### Security

- API keys use HMAC-SHA256 with a server-managed secret
- OAuth2 PKCE for end-user browser flows
- Rate limiting per IP + per API key
- Input validation on all endpoints
- Audit logging for admin actions
- OWASP Top 10 addressed in spec/security.md

---

## 4. Milestones and Deliverables

| Milestone | Deliverable | Timeline |
|---|---|---|
| M1: Protocol v1.0 | OpenAPI spec, protocol.md, federation.md | Month 1–2 |
| M2: Reference server | Fully functional Node.js server passing validator | Month 2–4 |
| M3: SDKs | JS SDK (@obp/client) + Python SDK (obp-client) published | Month 3–4 |
| M4: Tools | Validator CLI + scaffold generator published to npm | Month 4–5 |
| M5: Documentation | Complete docs site with guides, API reference, tutorials | Month 5–6 |
| M6: Federation | Two reference servers running and successfully federating | Month 5–6 |
| M7: Ecosystem | 3+ independent OBP-compatible implementations | Month 6–12 |

### Success criteria

- OBP validator reports 100% compliance on the reference server
- At least 2 independent implementations (different languages/frameworks) pass the validator
- Protocol specification achieves W3C Community Group draft status
- 3+ real businesses using an OBP-compatible system

---

## 5. Budget Breakdown

Total requested: **€ 50,000**

| Category | Amount | Description |
|---|---|---|
| Lead developer (12 months, part-time) | € 30,000 | Protocol design, reference server, SDKs, documentation |
| Frontend/UX developer (6 months, part-time) | € 10,000 | Reference frontend app, documentation site, widget |
| Security audit | € 5,000 | External security review of server and federation protocol |
| Infrastructure (12 months) | € 2,000 | Hosting for demo servers, documentation, CI/CD |
| Legal / IP / community | € 1,500 | Community group registration, trademark filing |
| Travel / community events | € 1,500 | Presentations at FOSDEM, Fediverse meetups |

---

## 6. Team

**Project lead: Nikola Vasović** — Independent software engineer based in Serbia, applying as an individual. Five years of professional experience developing and maintaining [Odoo](https://github.com/odoo/odoo), the leading open-source ERP platform (15 million users, 1,500+ active community contributors). Through this work I have contributed to Odoo's core modules and gained deep familiarity with the operational reality of small and medium businesses: how they handle scheduling, customer management, and the friction of fragmented software ecosystems.

The motivation for OBP comes directly from this experience. In five years of Odoo implementations I have repeatedly seen the same pattern: a business runs Odoo for accounting and inventory, but uses Booksy, Calendly, or a homegrown form for appointments — because no open interoperability standard exists. Customer data is split across systems, and the booking platform extracts rent for the privilege.

**GitHub**: [github.com/openbooking-protocol](https://github.com/openbooking-protocol)

**Relevant work:**
- OBP reference server: Node.js/TypeScript, Fastify, PostgreSQL, Redis — 288 tasks tracked, 97% complete
- OBP specification: OpenAPI 3.1, federation protocol (HTTP Signatures, JSON-LD), security model
- JavaScript SDK (`@obp/client`), Python SDK (`obp-client`), validator CLI, scaffold tool
- Contributions to Odoo open-source modules (Python, PostgreSQL)

**Why a solo applicant can deliver this:**
OBP's core value is the *protocol*, not the platform. The reference implementation is already functionally complete — federation, webhooks, OAuth2, iCal, analytics. The NLnet grant would fund the remaining work: security audit, ecosystem outreach, getting independent implementations built by others, and achieving W3C Community Group status. These are coordination and community tasks, not greenfield engineering.

**Advisors** (to be confirmed):
- Odoo community contributor / ERP integration specialist
- Small business representative (user research, pilot deployment)
- Open-source protocol/standards specialist

---

## 7. Comparison with Existing Solutions

| Solution | What it does | Why OBP is different |
|---|---|---|
| **Calendly / Acuity / Booksy** | Commercial SaaS booking platforms | Closed, proprietary, no interoperability, vendor lock-in, 15–30% fees |
| **Nextcloud Calendar** | Self-hosted CalDAV/CardDAV | Manages your own calendar; no protocol for *cross-server booking discovery* |
| **Mobilizon** | Federated event platform (ActivityPub) | Events and gatherings, not service appointments; no slot hold, no booking state machine |
| **OpenStreetMap + opening hours** | Public data about businesses | Read-only; no booking flow |
| **Cal.com** | Open-source Calendly alternative | Self-hosted but not federated; no standard protocol; one server, one operator |
| **Nextcloud Appointments** | Booking plugin for Nextcloud | Single-server only; not an open protocol; no cross-server discovery |

OBP is the only open protocol that addresses the *federation* layer: a customer on one OBP server can discover and book services from any other OBP server, without either party sharing an account on a common platform. This is the same architectural property that makes email and the web universal — and it is missing from every existing booking solution.

## 8. Relevance to NLnet / NGI Zero Commons Fund

OBP directly addresses NLnet's mission:

**Internet freedom and user agency**: OBP gives service providers control over their own booking data and customer relationships, without dependence on any platform.

**Open standards over proprietary silos**: OBP is designed to become an open standard (targeting W3C Community Group), as email and HTTP are open standards. The protocol, not any particular implementation, is the public good.

**Decentralization**: The federated architecture means there is no single point of failure, no central authority, and no way for any actor to monopolize the protocol.

**Digital commons**: The reference implementation (MIT license), specification (Creative Commons), SDKs, and documentation are all freely available public goods. Any developer can build on OBP without payment or permission.

**Practical impact**: The booking problem is not abstract — independent salons, clinics, tutors, and sports venues across Europe pay significant commissions to platforms. OBP offers a concrete, working alternative.

**Fediverse ecosystem expansion**: OBP complements ActivityPub-based social networks. A hairdresser running their own OBP server can offer booking directly from their social profile, without going through a commercial platform.

---

## 9. Demo Video Script (2–3 minutes)

*[Script for recording — use a screen recorder (OBS, Loom) with terminal + browser side by side]*

---

**[0:00–0:20] Hook**

*Narration (voiceover or text overlay):*
"You can send an email to anyone, regardless of which email provider they use. You can visit any website, regardless of which hosting company runs it. But to book an appointment, you're forced to use whichever platform the business chose — and give that platform your data. OBP changes that."

---

**[0:20–0:50] What is OBP?**

*Show in browser:*
```
curl http://localhost:3000/.well-known/obp | jq
```
Point out: `serverUrl`, `capabilities: ["booking", "federation", "webhooks"]`, `federation.publicKeyId`.

*Narration:* "Every OBP server announces itself at a standard URL — like a business card. Any client, any aggregator, any calendar app can discover it and start booking."

---

**[0:50–1:30] Self-hosting in 60 seconds**

*Show in terminal:*
```bash
git clone https://github.com/openbooking-protocol/obp
cd obp
docker compose up -d postgres redis
cd server && npm install
npm run db:migrate && npm run db:seed
npm run dev
```

*Show result:* Server starts, logs show `Server started` on port 3000.

*Then show:*
```bash
curl http://localhost:3000/obp/v1/providers | jq '.items[0].name'
# "Frizerski salon Nikola"
curl http://localhost:3000/obp/v1/services?providerId=... | jq '[.items[].name]'
# ["Muško šišanje", "Žensko šišanje", "Farbanje"]
```

*Narration:* "A working booking server — with real services, real schedules, and real availability — running in under a minute."

---

**[1:30–2:10] End-to-end booking flow**

*Open browser at `http://localhost:3001` (frontend):*
1. Home page — show search bar and categories
2. Click on "Frizerski salon Nikola"
3. Click "Muško šišanje" (30 min, 1500 RSD)
4. Pick tomorrow's date — slots appear (09:00, 09:40, 10:20...)
5. Select 09:00 — slot held for 10 minutes, countdown visible
6. Fill in: Name, Email, optional note
7. Click "Book" — confirmation page appears
8. Show "Download .ics" button — click it, calendar file downloads

*Narration:* "Slot hold prevents double-booking during checkout. The booking creates an iCal file compatible with any calendar app."

---

**[2:10–2:40] Federation demo**

*Show in terminal — start a second server on port 3001:*
```bash
# Terminal 2
PORT=3001 SERVER_URL=http://localhost:3001 SERVER_NAME="Novi Sad Server" npm run dev
```

*Register as peers via API:*
```bash
curl -X POST http://localhost:3000/federation/peers \
  -H "X-Api-Key: ..." \
  -d '{"serverUrl": "http://localhost:3001"}'
```

*Show federated search in browser:*
- Toggle "Search all servers" on
- Search returns results from both servers
- Each result shows server badge: "Local" (green) vs "localhost:3001" (blue)

*Narration:* "Two independent servers, no shared database, no central authority — but a customer on one can discover and book services on the other. This is the core of OBP."

---

**[2:40–3:00] Call to action**

*Show GitHub repo: github.com/openbooking-protocol/obp*

*Narration:* "OBP is open source under MIT and AGPL licenses. The specification is Creative Commons. If you run a small business — host it yourself. If you're a developer — build with the REST API or the JavaScript and Python SDKs. If you believe booking should be a commons, not a platform — join us."

---

## 10. Submission Checklist

- [x] Problem Statement (section 1)
- [x] Project Description (section 2)
- [x] Technical Approach (section 3)
- [x] Milestones + Deliverables (section 4)
- [x] Budget Breakdown (section 5)
- [x] Team Description (section 6)
- [x] Relevance to NLnet/NGI Zero (section 7)
- [ ] Demo video recorded and uploaded
- [ ] Submit via NLnet application portal (https://nlnet.nl/propose/)

---

*OpenBooking Protocol — https://github.com/openbooking-protocol/obp*
*License: MIT (code) / CC BY 4.0 (specification and documentation)*
