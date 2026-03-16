# Federation

OBP supports **federated discovery** — a customer on one OBP server can discover and book services on any other OBP server, similar to how ActivityPub enables cross-server social networking.

## How federation works

```
Customer App (Server A)
    │
    ├── Discovers Server B via /.well-known/obp
    ├── Fetches services from Server B's API
    ├── Creates a hold on Server B
    └── Creates a booking on Server B
         │
         └── Server B sends confirmation to customer
```

All cross-server communication uses standard HTTP requests authenticated with **HTTP Signatures (RFC 9421)** and **Ed25519 keys**.

## Server discovery

Every OBP server exposes a discovery endpoint:

```bash
curl https://obp.example.com/.well-known/obp
```

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

Key fields:
- `federation_enabled` — whether this server accepts cross-server bookings
- `public_key` — Ed25519 public key (DER, base64) for verifying HTTP Signatures
- `public_key_id` — Canonical key identifier used in `Signature` headers

## Peer registration

Before two servers can exchange bookings, they register each other as peers:

```bash
# On Server A, register Server B as a peer
curl -X POST https://server-a.example.com/obp/v1/federation/peers \
  -H "X-Api-Key: ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "server_url": "https://server-b.example.com",
    "trusted": true
  }'
```

The server will:
1. Fetch `https://server-b.example.com/.well-known/obp`
2. Validate the response
3. Store the peer's public key for signature verification
4. Send a handshake request to Server B (Server B also stores Server A)

### List peers

```bash
curl https://server-a.example.com/obp/v1/federation/peers \
  -H "X-Api-Key: ADMIN_KEY"
```

```json
{
  "data": [
    {
      "id": "peer_xyz",
      "server_url": "https://server-b.example.com",
      "server_name": "Server B",
      "status": "active",
      "trusted": true,
      "added_at": "2026-03-01T10:00:00Z",
      "last_seen": "2026-03-16T08:00:00Z"
    }
  ]
}
```

## HTTP Signatures

All federation requests (server-to-server) must be signed using HTTP Signatures (RFC 9421) with Ed25519.

### Signing a request

The signing server includes:
- `Signature-Input` header specifying which components are signed
- `Signature` header containing the base64-encoded signature

```http
POST /obp/v1/federation/bookings HTTP/1.1
Host: server-b.example.com
Content-Type: application/json
Signature-Input: sig1=("@method" "@target-uri" "content-digest" "date");keyid="https://server-a.example.com/.well-known/obp#key";alg="ed25519"
Content-Digest: sha-256=:abc123...:
Date: Mon, 16 Mar 2026 10:00:00 GMT
Signature: sig1=:base64encodedSignature:
```

### Verifying a request

Receiving servers:
1. Extract `keyid` from `Signature-Input`
2. Fetch the public key from the keyid URL (or use cached version)
3. Reconstruct the signing base string
4. Verify the Ed25519 signature

Requests with invalid or missing signatures are rejected with `401 Unauthorized`.

## Cross-server bookings

When a customer books a service on a remote server, the local server acts as a **proxy**:

```bash
# Customer app sends booking request to their home server (Server A)
curl -X POST https://server-a.example.com/obp/v1/federation/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "remote_server": "https://server-b.example.com",
    "hold_id": "hold_remote_abc",
    "service_id": "svc_remote_xyz",
    "customer": {
      "name": "Ana Petrović",
      "email": "ana@example.com"
    }
  }'
```

Server A:
1. Validates the request
2. Signs it with its Ed25519 private key
3. Forwards to Server B's `/obp/v1/bookings`
4. Returns the booking response to the customer

The `booking.id` returned references the booking on Server B. Customers use Server B's confirmation URL and iCal link directly.

## Federated search

Clients can search across multiple servers simultaneously:

```bash
# Search for yoga services across all known peers
curl "https://server-a.example.com/obp/v1/federation/search?q=yoga&category=sport"
```

Response aggregates results from all connected peers:

```json
{
  "data": [
    {
      "service": { "id": "svc_...", "name": "Morning Yoga", "..." },
      "provider": { "id": "prv_...", "name": "Yoga Studio", "..." },
      "server_url": "https://server-b.example.com",
      "server_name": "Server B"
    }
  ],
  "servers_queried": ["https://server-b.example.com", "https://server-c.example.com"],
  "servers_failed": []
}
```

## Security considerations

### Key rotation

Rotate your server's Ed25519 key pair periodically:

```bash
curl -X POST https://obp.example.com/obp/v1/federation/keys/rotate \
  -H "X-Api-Key: ADMIN_KEY"
```

The server will:
1. Generate a new key pair
2. Update `/.well-known/obp` with the new public key
3. Notify all active peers of the key change
4. Keep the old key valid for 24 hours to allow peers to update

### Rate limiting

Federation endpoints are rate-limited per peer server IP. Configure limits in `server/.env`:

```env
FEDERATION_RATE_LIMIT_MAX=1000
FEDERATION_RATE_LIMIT_WINDOW=3600
```

### Blocking peers

Remove a peer to stop accepting federation requests from them:

```bash
curl -X DELETE https://obp.example.com/obp/v1/federation/peers/peer_xyz \
  -H "X-Api-Key: ADMIN_KEY"
```

### Disabling federation

To run a closed (non-federated) server, set in `server/.env`:

```env
FEDERATION_ENABLED=false
```

The `/.well-known/obp` response will return `"federation_enabled": false` and all federation endpoints will return `403 Forbidden`.
