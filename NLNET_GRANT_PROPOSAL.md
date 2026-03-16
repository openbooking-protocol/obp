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

**Project lead** — 8 years of backend engineering experience; built and operated scheduling SaaS used by 500+ businesses; contributor to open-source projects (Node.js ecosystem, ActivityPub tools). Familiar with federated protocols, REST API design, and running production PostgreSQL/Redis systems.

**Advisors** (to be confirmed):
- ActivityPub/Fediverse protocol expert
- Small business association representative (user research)
- Open-source sustainability specialist

---

## 7. Relevance to NLnet / NGI Zero Commons Fund

OBP directly addresses NLnet's mission:

**Internet freedom and user agency**: OBP gives service providers control over their own booking data and customer relationships, without dependence on any platform.

**Open standards over proprietary silos**: OBP is designed to become an open standard (targeting W3C Community Group), as email and HTTP are open standards. The protocol, not any particular implementation, is the public good.

**Decentralization**: The federated architecture means there is no single point of failure, no central authority, and no way for any actor to monopolize the protocol.

**Digital commons**: The reference implementation (MIT license), specification (Creative Commons), SDKs, and documentation are all freely available public goods. Any developer can build on OBP without payment or permission.

**Practical impact**: The booking problem is not abstract — independent salons, clinics, tutors, and sports venues across Europe pay significant commissions to platforms. OBP offers a concrete, working alternative.

**Fediverse ecosystem expansion**: OBP complements ActivityPub-based social networks. A hairdresser running their own OBP server can offer booking directly from their social profile, without going through a commercial platform.

---

## 8. Demo Video Script (2–3 minutes)

*[Script for recording — actual video to be recorded for submission]*

**[0:00–0:20] Hook**
"You can send an email to anyone, regardless of which email provider they use. You can visit any website, regardless of which hosting company runs it. But to book an appointment, you're forced to use whichever platform the business chose — and give that platform your data. OBP changes that."

**[0:20–0:50] What is OBP?**
Show the `/.well-known/obp` endpoint. Explain it's like a business card for any booking server — anyone can discover it, connect to it, book from it.

**[0:50–1:30] Self-hosting demo**
Run `npx create-obp-server my-salon` — show the generated project. Start it, run `npx @obp/validator http://localhost:3000` — all checks pass.

**[1:30–2:10] End-to-end booking**
Open the reference frontend. Browse services. Pick a slot. Fill in name + email. Confirm. Show the confirmation page with iCal download.

**[2:10–2:40] Federation demo**
Start two local servers. Register them as peers. Search from Server A — results appear from Server B. Book a Novi Sad service from the Belgrade app.

**[2:40–3:00] Call to action**
"OBP is open source, MIT licensed, and ready for early adopters. If you run a business, host it yourself. If you're a developer, build with the SDK. If you're a community, help us grow the standard."

---

## 9. Submission Checklist

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
