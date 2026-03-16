# OBP API Reference — Specification

**Version:** 1.0.0-draft

This document describes all OBP API endpoints at the specification level. For the machine-readable OpenAPI definition, see `openapi.yaml`.

---

## Base URL

```
https://{server}/obp/v1
```

The server base URL is discovered via `GET /.well-known/obp`.

---

## Authentication

### API Key

Provider management endpoints require an API key:

```
X-Api-Key: obpk_<secret>
```

Scopes:
- `read` — GET endpoints
- `write` — POST, PUT, PATCH, DELETE endpoints
- `admin` — server administration (provider creation, peer management)

### Bearer token (OAuth2)

End-user actions via the frontend use JWT bearer tokens obtained via the OAuth2 authorization code flow with PKCE:

```
Authorization: Bearer <jwt>
```

### Public endpoints

Discovery, service browsing, slot listing, and booking creation are public (no authentication required).

---

## Endpoints

### Discovery

#### `GET /.well-known/obp`

Returns the server's OBP discovery document.

**Response:** `OBPDiscoveryDocument`
- `version` — protocol version (`"1.0"`)
- `server.public_key` — Ed25519 public key (for federation)
- `capabilities` — enabled features
- `api.base_url` — API root path

---

#### `GET /obp/v1/providers`

List active providers. Public.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by ProviderCategory |
| `q` | string | Full-text search |
| `lat`, `lng` | number | Proximity sort |
| `limit` | integer | Default 20, max 100 |
| `cursor` | string | Pagination cursor |

**Response:** `{ data: Provider[], pagination: Pagination }`

---

#### `GET /obp/v1/providers/{id}`

Get single provider by ID or slug. Public.

---

#### `GET /obp/v1/categories`

List all supported provider and service categories. Public. Cached (1h).

---

### Services

#### `GET /obp/v1/services`

List active services. Public.

**Query params:** `provider_id`, `category`, `q`, `limit`, `cursor`

---

#### `GET /obp/v1/services/{id}`

Get single service. Public.

---

#### `POST /obp/v1/services`

Create a service. Requires `write` API key.

**Body:** `ServiceCreate` (name, category, duration_minutes required)

---

#### `PUT /obp/v1/services/{id}`

Replace service fields. Requires `write` API key.

---

#### `DELETE /obp/v1/services/{id}`

Deactivate a service (soft delete). Does not cancel existing bookings.

---

### Availability

#### `GET /obp/v1/slots`

Compute available slots for a service. Public.

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `service_id` | string | **yes** | |
| `date_from` | date | **yes** | YYYY-MM-DD |
| `date_to` | date | **yes** | YYYY-MM-DD, max 30 days from date_from |
| `timezone` | string | no | IANA timezone for date interpretation |
| `resource_id` | string | no | Specific resource filter |

**Response:** `{ data: Slot[] }` ordered by `start_at` ascending.

**Performance note:** Slots are computed on-the-fly. Requests for large date ranges may be slower.

---

#### `GET /obp/v1/slots/{id}`

Get current status of a slot (available / held / booked). Public.

---

#### `POST /obp/v1/slots/{id}/hold`

Hold a slot. Public (no auth required).

**Body:**
```json
{ "ttl_seconds": 600 }
```

**Response:**
```json
{ "slot_id": "slt_9xkr2mwp", "expires_at": "2026-04-01T07:15:00Z" }
```

**Errors:**
- `409` — slot already held or booked

Atomicity: implemented via Redis `SET NX EX`. Only one concurrent hold per slot.

---

### Bookings

#### `POST /obp/v1/bookings`

Create a booking. Public.

**Body:**
```json
{
  "slot_id": "slt_9xkr2mwp",
  "customer": {
    "name": "Marko Marković",
    "email": "marko@example.com",
    "phone": "+381601234567",
    "notes": null
  }
}
```

**Errors:**
- `409` — slot no longer available (race condition)
- `422` — validation error

---

#### `GET /obp/v1/bookings/{id}`

Get booking details.

- Without API key: requires `?customer_email=<email>` matching the booking
- With API key (`read` scope): full access

---

#### `POST /obp/v1/bookings/{id}/confirm`

Confirm a booking (`pending → confirmed`). Requires `write` API key. Triggers `booking.confirmed` webhook.

---

#### `POST /obp/v1/bookings/{id}/cancel`

Cancel a booking. Can be called by:
- Customer: no API key, requires `?customer_email=<email>`
- Provider: `write` API key

Triggers `booking.cancelled` webhook.

---

#### `GET /obp/v1/bookings`

List provider's bookings. Requires `read` API key.

**Query params:** `status`, `service_id`, `date_from`, `date_to`, `limit`, `cursor`

---

#### `POST /obp/v1/bookings/{id}/complete`

Mark as completed (`confirmed → completed`). Provider only.

---

#### `POST /obp/v1/bookings/{id}/no-show`

Mark as no-show (`confirmed → no_show`). Provider only. Only after `slot.start_at`.

---

### Schedule

#### `GET /obp/v1/providers/{provider_id}/schedule`

Get provider or resource schedule. Requires `read` API key.

**Query param:** `resource_id` (optional)

---

#### `PUT /obp/v1/providers/{provider_id}/schedule`

Create or replace schedule. Requires `write` API key.

PUT semantics: the full schedule is replaced. To add a single exception, fetch first, append, then PUT.

---

### Webhooks

#### `POST /obp/v1/webhooks`

Register a webhook. Requires `write` API key.

**Body:**
```json
{
  "url": "https://my-app.example.com/webhooks/obp",
  "events": ["booking.created", "booking.cancelled"]
}
```

**Response includes `secret` (shown only once).**

Constraints:
- URL must use HTTPS
- Maximum 10 webhooks per provider
- Duplicate URLs per provider are rejected

#### Webhook delivery

OBP makes `POST` requests to the registered URL with:
- Body: `WebhookPayload` (JSON)
- Header: `X-OBP-Signature: sha256=<hex_digest>` (HMAC-SHA256 of body using secret)
- Header: `X-OBP-Event: booking.created`

**Retry policy:** 1m, 5m, 30m, 2h, 8h (5 attempts). After 5 failures → webhook `suspended`.

#### `DELETE /obp/v1/webhooks/{id}`

Delete a webhook. Requires `write` API key.

#### `POST /obp/v1/webhooks/{id}/rotate-secret`

Rotate the signing secret. Old secret immediately invalidated.
