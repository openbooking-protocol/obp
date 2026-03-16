# Contributing to OpenBooking Protocol

Thank you for your interest in contributing to OBP! This document explains how to participate.

## Ways to Contribute

- **Protocol feedback** — open a Discussion or RFC issue
- **Bug reports** — open a Bug Report issue
- **Feature requests** — open a Feature Request issue
- **Code** — submit a Pull Request
- **Documentation** — improve guides and examples
- **Testing** — test implementations and report findings

## Development Setup

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- Git

### Local Setup

```bash
git clone https://github.com/openbooking-protocol/obp.git
cd obp

# Start infrastructure
docker compose up -d postgres redis

# Server
cd server
npm install
cp .env.example .env
npm run db:migrate
npm run dev

# Frontend (separate terminal)
cd ../frontend
npm install
npm run dev
```

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Contribution Process

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feat/your-feature` or `fix/your-bug`
3. **Make changes** following the code style
4. **Write/update tests** — all PRs must maintain >80% coverage
5. **Run tests**: `npm test` must pass
6. **Commit** using conventional commits (see below)
7. **Open a Pull Request** against `main`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add slot hold expiry notification
fix: correct timezone offset in slot generation
docs: update federation guide
test: add booking state machine edge cases
chore: upgrade fastify to v4.28
spec: clarify Provider schema federation_url field
```

## Protocol Changes (RFCs)

Changes to the OBP protocol specification require an RFC process:

1. Open an issue with the `RFC` template
2. Discussion period: minimum 2 weeks
3. At least 2 maintainer approvals required
4. Breaking changes require a major version bump

## Code Style

- TypeScript strict mode — no `any`, no `!` assertions without comment
- ESLint + Prettier — run `npm run lint` before committing
- No magic numbers — use named constants
- Tests alongside source: `foo.ts` → `foo.test.ts`

## Spec-First Development

New features follow this order:

1. Update `spec/` documents
2. Update OpenAPI YAML
3. Implement server
4. Implement frontend/SDK
5. Write tests

## Questions?

Open a [GitHub Discussion](https://github.com/openbooking-protocol/obp/discussions) or join our community chat.

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
