# Configuration Reference

All configuration is done through environment variables. Copy `.env.example` to `.env` and edit as needed.

## Core settings

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime environment: `development`, `production`, `test` |
| `PORT` | No | `3000` | HTTP port to listen on |
| `HOST` | No | `0.0.0.0` | Host to bind to |
| `LOG_LEVEL` | No | `info` | Pino log level: `trace`, `debug`, `info`, `warn`, `error` |

## Database

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (`postgresql://user:pass@host:port/db`) |
| `DATABASE_POOL_MIN` | No | `2` | Minimum connection pool size |
| `DATABASE_POOL_MAX` | No | `10` | Maximum connection pool size |
| `DATABASE_SSL` | No | `false` | Enable SSL for database connection (recommended in production) |

## Redis

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | Yes | — | Redis connection string (`redis://host:port`) |
| `REDIS_KEY_PREFIX` | No | `obp:` | Prefix for all Redis keys |
| `SLOT_HOLD_TTL` | No | `600` | Slot hold duration in seconds (10 min) |
| `CACHE_TTL` | No | `300` | General cache TTL in seconds (5 min) |

## Security

| Variable | Required | Description |
|---|---|---|
| `API_KEY_SECRET` | Yes | HMAC-SHA256 secret for signing API keys (min 32 chars; generate: `openssl rand -hex 32`) |
| `JWT_SECRET` | Yes | Secret for signing OAuth2 JWTs (min 32 chars; generate: `openssl rand -hex 32`) |
| `JWT_ACCESS_TTL` | No | Access token lifetime in seconds (default: `3600` = 1 hour) |
| `JWT_REFRESH_TTL` | No | Refresh token lifetime in seconds (default: `2592000` = 30 days) |
| `ADMIN_API_KEY` | No | Static admin API key for bootstrapping; generate a proper key via the API instead |

## Server identity

| Variable | Required | Default | Description |
|---|---|---|---|
| `OBP_SERVER_URL` | Yes | — | Public HTTPS URL (used in `/.well-known/obp` and federation) |
| `OBP_SERVER_NAME` | No | `My OBP Server` | Human-readable server name |
| `OBP_VERSION` | No | `1.0.0` | OBP protocol version to advertise |

## Federation

| Variable | Required | Default | Description |
|---|---|---|---|
| `FEDERATION_ENABLED` | No | `true` | Enable/disable federation (`true`/`false`) |
| `FEDERATION_PRIVATE_KEY` | No | — | Ed25519 private key (base64). Auto-generated if not set. |
| `FEDERATION_KEY_ID` | No | `{OBP_SERVER_URL}/.well-known/obp#key` | Key identifier in HTTP Signatures |
| `FEDERATION_RATE_LIMIT_MAX` | No | `1000` | Max federation requests per window per peer |
| `FEDERATION_RATE_LIMIT_WINDOW` | No | `3600` | Rate limit window in seconds |
| `FEDERATION_REQUEST_TIMEOUT` | No | `10000` | Timeout for outbound federation requests (ms) |

## Rate limiting

| Variable | Required | Default | Description |
|---|---|---|---|
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window per IP |
| `RATE_LIMIT_WINDOW` | No | `60` | Rate limit window in seconds |
| `RATE_LIMIT_SKIP_SUCCESSFUL` | No | `false` | Don't count successful requests |

## Email / SMTP

| Variable | Required | Default | Description |
|---|---|---|---|
| `SMTP_HOST` | No | — | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | Use TLS (`true` for port 465) |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `SMTP_FROM` | No | `noreply@localhost` | From address for outbound emails |
| `EMAIL_BOOKING_CONFIRMATION` | No | `true` | Send confirmation emails to customers |
| `EMAIL_BOOKING_REMINDER` | No | `true` | Send reminder emails (24h before) |

## CORS

| Variable | Required | Default | Description |
|---|---|---|---|
| `CORS_ORIGIN` | No | `*` | Allowed origins (comma-separated, or `*` for all) |
| `CORS_CREDENTIALS` | No | `false` | Allow credentials (cookies/auth headers) |

## Webhooks

| Variable | Required | Default | Description |
|---|---|---|---|
| `WEBHOOK_SECRET` | No | Auto-generated | HMAC secret for signing webhook payloads |
| `WEBHOOK_TIMEOUT` | No | `5000` | Timeout for webhook delivery (ms) |
| `WEBHOOK_MAX_RETRIES` | No | `3` | Retry failed webhook deliveries |

## Audit logging

| Variable | Required | Default | Description |
|---|---|---|---|
| `AUDIT_LOG_ENABLED` | No | `false` | Log all admin actions to database |
| `AUDIT_LOG_RETENTION_DAYS` | No | `90` | Delete audit logs older than N days |

## Full `.env.example`

```env
# ─── Core ─────────────────────────────────────────
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# ─── Database ─────────────────────────────────────
DATABASE_URL=postgresql://obp:CHANGE_ME@postgres:5432/obp
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ─── Redis ────────────────────────────────────────
REDIS_URL=redis://redis:6379
SLOT_HOLD_TTL=600

# ─── Security ─────────────────────────────────────
# Generate with: openssl rand -hex 32
API_KEY_SECRET=
JWT_SECRET=

# ─── Server identity ──────────────────────────────
OBP_SERVER_URL=https://obp.yourdomain.com
OBP_SERVER_NAME=My OBP Server

# ─── Federation ───────────────────────────────────
FEDERATION_ENABLED=true

# ─── Rate limiting ────────────────────────────────
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60

# ─── Email ────────────────────────────────────────
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=
SMTP_FROM=noreply@yourdomain.com

# ─── CORS ─────────────────────────────────────────
CORS_ORIGIN=*

# ─── Audit ────────────────────────────────────────
AUDIT_LOG_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=90
```
