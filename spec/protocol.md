# OpenBooking Protocol — Protocol Specification

**Version:** 1.0.0-draft
**Status:** Draft
**Date:** 2026-03-16

---

## Abstract

OpenBooking Protocol (OBP) is an open, HTTP-based protocol for scheduling and booking services. It defines a standard REST API that any service provider can implement, and a federation layer that enables independent OBP servers to discover each other and exchange bookings without a central authority.

---

## 1. Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHOULD", "RECOMMENDED", and "MAY" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

**Server** — An OBP-compliant HTTP server hosting one or more Providers.

**Client** — Any software consuming the OBP API (browser, mobile app, another OBP server).

**Provider** — A business or individual offering bookable services on an OBP server.

**Service** — A specific bookable offering by a Provider.

**Resource** — A physical or virtual entity required to deliver a Service.

**Slot** — A computed available time window for a Service.

**Booking** — A confirmed reservation of a Slot by a Customer.

**Schedule** — Rules defining when a Provider or Resource is available.

**Peer** — Another OBP server registered for federation.

---

## 2. Protocol overview

### 2.1 Public booking flow

```
Client                          OBP Server
  │                                 │
  ├─ GET /.well-known/obp ─────────►│  Discover server capabilities
  ├─ GET /obp/v1/services ─────────►│  Browse services
  ├─ GET /obp/v1/slots ────────────►│  Check availability
  ├─ POST /obp/v1/slots/{id}/hold ─►│  Hold slot (Redis TTL)
  ├─ POST /obp/v1/bookings ────────►│  Create booking (optimistic lock)
  └─ POST /obp/v1/bookings/{id}/confirm (provider) ─►│
```

### 2.2 Federated booking flow

```
Client      Server A (home)           Server B (provider)
  │              │                          │
  ├─ Search ────►│                          │
  │              ├─ GET /federation/search ►│
  │              │◄─ results ──────────────┤
  │◄─ results ──┤                          │
  ├─ Book ──────►│                          │
  │              ├─ POST /federation/book ─►│
  │              │◄─ booking ─────────────┤
  │◄─ booking ──┤                          │
```

### 2.3 API versioning

The API is versioned via the URL path: `/obp/v1/`. The version segment is mandatory. Future versions will introduce new path prefixes (`/obp/v2/`) without removing previous versions for a deprecation period of at least 12 months.

### 2.4 Transport

All OBP API endpoints MUST be served over HTTPS (TLS 1.2+) in production. HTTP MAY be used for local development only.

### 2.5 Content type

Request and response bodies MUST use `Content-Type: application/json` unless otherwise specified. The WebFinger endpoint uses `application/jrd+json`.

### 2.6 Character encoding

All string values MUST be UTF-8 encoded.

---

## 3. Identifiers

OBP uses prefixed NanoID identifiers for all entities:

| Entity | Prefix | Example |
|--------|--------|---------|
| Provider | `prv_` | `prv_k3j9mxyz` |
| Service | `svc_` | `svc_h7k2pqrs` |
| Resource | `res_` | `res_ana_p` |
| Schedule | `sch_` | `sch_m2n8prst` |
| Slot | `slt_` | `slt_9xkr2mwp` |
| Booking | `bkg_` | `bkg_q5r8stuv` |
| Webhook | `whk_` | `whk_r2s5tuvw` |
| Peer | `peer_` | `peer_berlin1` |

Slot IDs are deterministic: `slt_{base62(sha256(service_id + ":" + start_at_utc)[:8])}`. This allows clients to reference slots without prior listing.

---

## 4. Datetime handling

- All datetimes are stored and returned in **UTC**, formatted as RFC 3339: `2026-04-01T08:00:00Z`
- Schedule times (`start_time`, `end_time`) are wall-clock times in the Schedule's IANA timezone
- DST transitions: slots falling in a DST gap are skipped; slots in a DST fold are generated once
- Clients SHOULD send datetimes with an explicit UTC offset; bare local times are rejected

---

## 5. Pagination

List endpoints use opaque cursor-based pagination:

```
GET /obp/v1/services?limit=20&cursor=eyJpZCI6MTAwfQ==

Response:
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIwfQ==",
    "has_more": true
  }
}
```

- `limit` defaults to 20, maximum 100
- Cursors are opaque strings; clients MUST NOT parse or construct them
- Cursor validity is not guaranteed across schema migrations

---

## 6. Error handling

All errors use [RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807):

```json
{
  "type": "https://obp.dev/errors/slot-unavailable",
  "title": "Slot is no longer available",
  "status": 409,
  "detail": "Slot slt_9xkr2mwp was booked by another customer.",
  "instance": "/obp/v1/bookings"
}
```

Validation errors (422) additionally include a field-level `errors` array:

```json
{
  "type": "https://obp.dev/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "errors": [
    { "field": "duration_minutes", "message": "Must be a multiple of 5" }
  ]
}
```

### Standard error types

| Type URI | Status | Meaning |
|----------|--------|---------|
| `https://obp.dev/errors/bad-request` | 400 | Invalid parameters |
| `https://obp.dev/errors/unauthorized` | 401 | Missing or invalid auth |
| `https://obp.dev/errors/forbidden` | 403 | Insufficient permissions |
| `https://obp.dev/errors/not-found` | 404 | Resource not found |
| `https://obp.dev/errors/conflict` | 409 | State conflict (e.g., slot taken) |
| `https://obp.dev/errors/validation` | 422 | Schema validation failure |
| `https://obp.dev/errors/rate-limit-exceeded` | 429 | Rate limit hit |
| `https://obp.dev/errors/internal` | 500 | Server error |

---

## 7. Rate limiting

Every response includes:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1743500000
```

On `429 Too Many Requests`:
```
Retry-After: 30
```

Default limits (server SHOULD configure per deployment):

| Endpoint group | Unauthenticated | API key | Federation |
|----------------|----------------|---------|------------|
| Discovery | 300/min | 300/min | — |
| Slots (read) | 60/min | 300/min | 300/min |
| Bookings (write) | 20/min | 100/min | 60/min |
| Federation | — | — | 60/min (open), 300/min (verified) |

---

## 8. Conformance levels

An OBP server MUST implement:
- Discovery endpoint (`/.well-known/obp`)
- Provider, Service, Slot, Booking endpoints
- RFC 7807 error format
- HTTPS

An OBP server SHOULD implement:
- Federation endpoints
- Webhooks
- iCal export

An OBP server MAY implement:
- OAuth2 / PKCE
- CalDAV compatibility
- Admin API

---

## 9. References

- [RFC 2119] Key words for RFCs — https://datatracker.ietf.org/doc/html/rfc2119
- [RFC 3339] Date and Time on the Internet — https://datatracker.ietf.org/doc/html/rfc3339
- [RFC 7033] WebFinger — https://datatracker.ietf.org/doc/html/rfc7033
- [RFC 7807] Problem Details for HTTP APIs — https://datatracker.ietf.org/doc/html/rfc7807
- [RFC 9110] HTTP Semantics — https://datatracker.ietf.org/doc/html/rfc9110
- [RFC 9421] HTTP Message Signatures — https://datatracker.ietf.org/doc/html/rfc9421
- [OpenAPI 3.1] — https://spec.openapis.org/oas/v3.1.0
- [JSON-LD 1.1] — https://www.w3.org/TR/json-ld11/
