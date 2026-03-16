# OBP Federation Protocol — Specification

**Version:** 1.0.0-draft

---

## 1. Overview

OBP federation enables independent OBP servers to discover each other and exchange bookings without a central authority. The federation model is inspired by ActivityPub and email: any server can communicate with any other server using a standard protocol.

```
┌────────────────┐   HTTP Signatures   ┌────────────────┐
│  OBP Server A  │◄───────────────────►│  OBP Server B  │
│  (Berlin)      │  federation API     │  (Belgrade)    │
└────────────────┘                     └────────────────┘
```

---

## 2. Discovery

### 2.1 Well-known endpoint

Every OBP server MUST expose:

```
GET /.well-known/obp
```

The response includes the server's public key and federation endpoint URLs:

```json
{
  "version": "1.0",
  "server": {
    "url": "https://obp.example.com",
    "public_key": { "algorithm": "Ed25519", "value": "MCow..." }
  },
  "capabilities": { "federation": true },
  "federation": {
    "enabled": true,
    "endpoints": {
      "search": "/obp/v1/federation/search",
      "slots":  "/obp/v1/federation/slots",
      "book":   "/obp/v1/federation/book",
      "cancel": "/obp/v1/federation/cancel"
    }
  }
}
```

### 2.2 WebFinger (optional)

Servers MAY support [RFC 7033](https://datatracker.ietf.org/doc/html/rfc7033) WebFinger for discovery:

```
GET /.well-known/webfinger?resource=https://obp.example.com&rel=https://obp.dev/ns/server
```

Response:
```json
{
  "subject": "https://obp.example.com",
  "links": [
    {
      "rel": "https://obp.dev/ns/server",
      "href": "https://obp.example.com/.well-known/obp",
      "type": "application/json"
    }
  ]
}
```

---

## 3. Server registration

Before two servers can exchange bookings, they MUST register with each other.

### 3.1 Registration flow

```
Server A                                Server B
    │                                       │
    ├─ GET /.well-known/obp ───────────────►│  Fetch B's public key
    │◄─ discovery doc ─────────────────────┤
    │                                       │
    ├─ POST /obp/v1/federation/peers ──────►│  Register (signed request)
    │   {server_url, name, public_key,      │
    │    nonce} + Signature header          │
    │◄─ {peer_id, status: pending} ────────┤
    │                                       │
    │  [Admin approves on Server B]         │
    │                                       │
    ├─ POST /obp/v1/federation/peers ◄──────┤  Reciprocal registration
    │   (Server B registers with A)         │
    │─► {peer_id, status: active} ─────────┤
```

### 3.2 Auto-approval

Servers MAY configure auto-approval for `open` trust level peers. `verified` and `trusted` peers require admin approval.

### 3.3 Key rotation

When a server rotates its Ed25519 key pair:
1. Update `/.well-known/obp` with the new public key
2. Call `PUT /obp/v1/federation/peers/{id}/key` on all registered peers
3. Old key accepted for 1-hour grace period
4. Peers re-fetch and cache the new key

---

## 4. HTTP Signatures (RFC 9421)

All server-to-server federation requests MUST be signed using [RFC 9421 HTTP Message Signatures](https://datatracker.ietf.org/doc/html/rfc9421) with Ed25519.

### 4.1 Required signed components

- `"@method"` — HTTP method
- `"@authority"` — Host
- `"@request-target"` — Path + query
- `"content-digest"` — SHA-256 of request body (for POST/PUT; omit for GET)
- `"date"` — RFC 7231 date

### 4.2 Signature headers

```
Signature-Input: sig1=("@method" "@authority" "@request-target" "date");
                 keyid="https://obp-berlin.example.com";
                 alg="ed25519";
                 created=1743500000;
                 nonce="a3f8b2c1d4e5f6a7b8c9d0e1"

Signature: sig1=:base64EncodedEd25519Signature:
```

- `keyid` is the registering server's base URL
- Receiving server looks up the public key from the peer record

### 4.3 Replay protection

- `created` timestamp MUST be within ±5 minutes of the receiver's clock
- `nonce` MUST be unique; receiving server stores nonces for 10 minutes and rejects duplicates
- Violations return `400` with error type `https://obp.dev/errors/signature-replay`

### 4.4 Verification algorithm

1. Extract `keyid` from `Signature-Input`
2. Look up peer record by `server_url = keyid`; reject if not found or blocked → 403
3. Verify the signature against the peer's stored public key
4. Check `created` within ±5 minutes → 400 if not
5. Check `nonce` not seen in last 10 minutes → 409 if replay detected
6. Process the request

---

## 5. Message format (JSON-LD)

All federation request bodies use JSON-LD with the OBP context:

```json
{
  "@context": "https://obp.dev/context/v1",
  "@type": "BookActivity",
  "actor": "https://obp-berlin.example.com",
  "object": { ... }
}
```

### 5.1 Activity types

| `@type` | Endpoint | Description |
|---------|----------|-------------|
| `BookActivity` | `POST /federation/book` | Create federated booking |
| `CancelActivity` | `POST /federation/cancel` | Cancel federated booking |
| `SyncActivity` | `GET /federation/sync` | Catalog sync (response only) |

---

## 6. Federation endpoints

### 6.1 `GET /federation/search`

Query this server's providers. Used by peer servers for cross-server discovery.

Returns `FederatedSearchResult[]` — partial provider data + service previews. Full details fetched separately.

**Filtering:** `q`, `category`, `lat`/`lng`/`radius_km`

### 6.2 `GET /federation/slots`

Query available slots for a specific service on this server. Same logic as the public `/slots` endpoint but authenticated via HTTP Signature.

**Required params:** `service_id`, `date_from`, `date_to`

### 6.3 `POST /federation/book`

Create a booking on this server on behalf of a peer's user.

```json
{
  "@context": "https://obp.dev/context/v1",
  "@type": "BookActivity",
  "actor": "https://obp-berlin.example.com",
  "object": {
    "slot_id": "slt_9xkr2mwp",
    "service_id": "svc_h7k2pqrs",
    "customer": { "name": "Max Müller", "email": "max@example.de" },
    "originating_booking_id": "bkg_remote_abc123",
    "originating_server": "https://obp-berlin.example.com"
  }
}
```

The response is a full `Booking` object with `federated_from` set.

### 6.4 `POST /federation/cancel`

Cancel a federated booking. Only the peer that created the booking may cancel it.

```json
{
  "@context": "https://obp.dev/context/v1",
  "@type": "CancelActivity",
  "actor": "https://obp-berlin.example.com",
  "object": {
    "booking_id": "bkg_q5r8stuv",
    "originating_booking_id": "bkg_remote_abc123",
    "reason": "Customer request"
  }
}
```

### 6.5 `GET /federation/sync`

Diff-based catalog sync. Returns providers and services changed since `since`.

```
GET /federation/sync?since=2026-04-01T00:00:00Z&limit=100
```

Response:
```json
{
  "server_url": "https://obp.example.com",
  "since": "2026-04-01T00:00:00Z",
  "until": "2026-04-01T15:30:00Z",
  "providers": {
    "upserted": [...],
    "deleted": ["prv_old123"]
  },
  "services": {
    "upserted": [...],
    "deleted": []
  }
}
```

Customer data is NEVER included in sync responses.

---

## 7. Trust and security model

### 7.1 Trust levels

| Level | Auto-approve | Rate limit | Sync | Cross-server bookings |
|-------|-------------|------------|------|-----------------------|
| `open` | Yes | 60/min | Pull only | Yes (with hold) |
| `verified` | No (admin) | 300/min | Pull | Yes |
| `trusted` | No (admin) | 1000/min | Push + Pull | Yes |
| `blocked` | — | 0 | No | No (403) |

### 7.2 Security rules

1. All federation requests MUST be signed (HTTP Signature). Unsigned → 401
2. Requests from unregistered peers → 403
3. Requests from `blocked` peers → 403
4. Nonce replay within 10 minutes → 409
5. Clock skew > 5 minutes → 400
6. Customer email is NEVER shared in sync responses
7. Booking customer data is transmitted only for the specific booking (data minimization)
8. Servers MUST use TLS 1.2+ for all federation endpoints
9. Peer public keys are cached for 1 hour and re-fetched on cache miss
10. Abuse reporting: servers MAY report abusive peers via admin channels (out of band)

### 7.3 Data minimization

Federated booking creates a booking with minimal customer data:
- Name, email, and optionally phone
- `federated_from` (originating server URL) is stored for reconciliation
- No browsing history, no session data, no profile data

The originating server is responsible for:
- Full customer record storage
- Customer email communications
- GDPR/data protection compliance for its users
