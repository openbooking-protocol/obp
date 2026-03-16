# OpenBooking Protocol (OBP)

An open, federated protocol for online booking systems — like email, but for appointments.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](LICENSE)
[![Spec License: MIT](https://img.shields.io/badge/Spec%20License-MIT-green.svg)](LICENSE)
[![Status: In Development](https://img.shields.io/badge/Status-In%20Development-yellow.svg)]()

## What is OBP?

OpenBooking Protocol is an open standard that enables interoperability between booking systems. Instead of being locked into closed platforms like Calendly, Fresha, or Booksy, any business can run their own OBP-compatible server and accept bookings from any OBP client — including clients on other servers.

Think of it like email: you can send an email from Gmail to Outlook. With OBP, a customer on server A can book an appointment with a provider on server B.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend    │     │  Frontend    │     │  Frontend    │
│  (Next.js)  │     │  (any)       │     │  (mobile)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  OBP Server │◄───►│  OBP Server │◄───►│  OBP Server │
│  (Salon A)  │     │  (Salon B)  │     │  (Doctor C) │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PostgreSQL │     │  PostgreSQL │     │  PostgreSQL │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Repository Structure

```
obp/
├── spec/           # Protocol specification (MIT)
├── server/         # Reference server implementation (AGPL-3.0)
├── frontend/       # Reference frontend application (AGPL-3.0)
├── sdk/            # Client libraries — JS/TS and Python (MIT)
├── docs/           # Documentation site
├── examples/       # Integration examples
└── tools/          # Validator, scaffold tools
```

## Key Features

- **Open protocol** — fully specified, anyone can implement it
- **Federated** — servers communicate with each other using HTTP Signatures + JSON-LD
- **Self-hostable** — run your own OBP server with Docker
- **Provider-agnostic** — works for hair salons, doctors, sports facilities, and more
- **iCal/CalDAV compatible** — integrates with existing calendar tools

## Quick Start

> Full documentation at [docs/](docs/)

```bash
# Clone the repository
git clone https://github.com/openbooking-protocol/obp.git
cd obp

# Start with Docker Compose
docker compose up -d

# The server is now running at http://localhost:3000
# API docs at http://localhost:3000/docs
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Server | Node.js + TypeScript + Fastify |
| Database | PostgreSQL 15+ |
| Cache | Redis |
| Frontend | Next.js 14+ (App Router) |
| Spec | OpenAPI 3.1 |
| Testing | Vitest + Playwright |
| Docs | VitePress |
| Deploy | Docker + Docker Compose |

## Protocol Overview

### Core Entities

- **Provider** — a business offering services (salon, clinic, gym...)
- **Service** — a bookable service with duration and price
- **Resource** — staff member, room, or equipment
- **Slot** — an available time window for a service
- **Booking** — a confirmed reservation

### Booking Flow

```
1. Search → GET /obp/v1/slots?service_id=...&date_from=...
2. Hold   → POST /obp/v1/slots/{id}/hold          (5 min TTL)
3. Book   → POST /obp/v1/bookings
4. Confirm→ POST /obp/v1/bookings/{id}/confirm
```

### Federation

OBP servers discover each other via `GET /.well-known/obp` and communicate using HTTP Signatures for authentication. This enables cross-server search and booking.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started.

## License

- **Server & Frontend**: [AGPL-3.0](LICENSE)
- **Protocol Specification & SDK**: MIT (see [LICENSE](LICENSE))

## Funding

This project is seeking funding from [NLnet NGI Zero](https://nlnet.nl/NGI0/) (€35,000 grant application).

---

*OpenBooking Protocol — Free the calendar.*
