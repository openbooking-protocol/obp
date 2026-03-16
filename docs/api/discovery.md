# Discovery API

## GET /.well-known/obp

Returns server metadata for federation discovery.

**Authentication:** None required
**Rate limit:** Not rate-limited

### Response `200 OK`

```json
{
  "obp_version": "1.0.0",
  "server_url": "https://obp.example.com",
  "server_name": "Example Booking Platform",
  "federation_enabled": true,
  "public_key": "MCowBQYDK2VdAyEA...",
  "public_key_id": "https://obp.example.com/.well-known/obp#key",
  "features": ["bookings", "webhooks", "ical"],
  "contact": "admin@example.com"
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `obp_version` | string | OBP protocol version (semver) |
| `server_url` | string | Canonical HTTPS URL of this server |
| `server_name` | string | Human-readable name |
| `federation_enabled` | boolean | Whether this server accepts cross-server bookings |
| `public_key` | string | Ed25519 public key (DER, base64) — present when `federation_enabled: true` |
| `public_key_id` | string | Key identifier for HTTP Signatures |
| `features` | string[] | Supported optional features |
| `contact` | string | Admin contact email |

### Feature flags

| Feature | Description |
|---|---|
| `bookings` | Core booking functionality (always present) |
| `webhooks` | Webhook subscriptions supported |
| `ical` | iCal export supported |
| `federation` | Cross-server federation supported |
| `oauth2` | OAuth2 Authorization Code flow supported |

---

## GET /obp/v1/categories

Returns all provider categories.

**Authentication:** None required

### Response `200 OK`

```json
{
  "data": [
    { "id": "health", "name": "Health & Wellness", "icon": "heart" },
    { "id": "beauty", "name": "Beauty", "icon": "scissors" },
    { "id": "sport", "name": "Sport & Fitness", "icon": "dumbbell" },
    { "id": "education", "name": "Education", "icon": "book" },
    { "id": "professional", "name": "Professional Services", "icon": "briefcase" },
    { "id": "other", "name": "Other", "icon": "grid" }
  ]
}
```

---

## GET /health

Health check endpoint.

**Authentication:** None required

### Response `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2026-03-16T10:00:00Z",
  "version": "1.0.0",
  "database": "ok",
  "redis": "ok"
}
```
