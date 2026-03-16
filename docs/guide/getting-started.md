# Getting Started

This guide walks you through running the OBP reference server locally.

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- Git

## Clone the repository

```bash
git clone https://github.com/openbooking-protocol/obp.git
cd obp
```

## Start the infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

## Configure the server

```bash
cd server
cp .env.example .env
```

Edit `.env` and set your values (the defaults work for local development).

## Run migrations and seed

```bash
npm install
npm run db:migrate
npm run db:seed
```

## Start the server

```bash
npm run dev
```

The server starts on `http://localhost:3000`.

## Verify

```bash
curl http://localhost:3000/.well-known/obp
```

You should see the server's OBP discovery document.

## Next steps

- [Quick Start tutorial](/guide/quick-start) — make your first booking in 5 minutes
- [API Reference](/api/overview) — explore all endpoints
- [Self-Hosting Guide](/guide/self-hosting) — deploy to production
