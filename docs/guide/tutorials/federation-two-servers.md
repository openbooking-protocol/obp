# Tutorial: Federating Two OBP Servers

This tutorial demonstrates setting up cross-server booking between two OBP instances — for example, a booking aggregator that lets users book services from multiple independent providers across different servers.

## Scenario

- **Server A** (`https://belgrade.obp.example`) — Belgrade providers
- **Server B** (`https://novi-sad.obp.example`) — Novi Sad providers

A customer on Server A should be able to discover and book services from Server B.

## Prerequisites

- Two running OBP servers (see [Self-Hosting Guide](../self-hosting.md))
- Both servers accessible over HTTPS
- Admin API keys for both servers
- `FEDERATION_ENABLED=true` on both servers

## Step 1: Verify both servers are federation-ready

```bash
# Check Server A
curl https://belgrade.obp.example/.well-known/obp | jq '{version: .obp_version, federation: .federation_enabled, key: .public_key[0:20]}'

# Check Server B
curl https://novi-sad.obp.example/.well-known/obp | jq '{version: .obp_version, federation: .federation_enabled, key: .public_key[0:20]}'
```

Both should return `"federation_enabled": true` with a valid `public_key`.

## Step 2: Register the peer relationship

Register Server B as a peer on Server A:

```bash
curl -X POST https://belgrade.obp.example/obp/v1/federation/peers \
  -H "X-Api-Key: SERVER_A_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "server_url": "https://novi-sad.obp.example",
    "trusted": true
  }'
```

Server A will:
1. Fetch `https://novi-sad.obp.example/.well-known/obp`
2. Validate and store Server B's public key
3. Send a signed handshake to Server B

Register Server A as a peer on Server B (reciprocal):

```bash
curl -X POST https://novi-sad.obp.example/obp/v1/federation/peers \
  -H "X-Api-Key: SERVER_B_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "server_url": "https://belgrade.obp.example",
    "trusted": true
  }'
```

## Step 3: Verify the peer connection

```bash
# Check peers on Server A
curl https://belgrade.obp.example/obp/v1/federation/peers \
  -H "X-Api-Key: SERVER_A_ADMIN_KEY"
```

```json
{
  "data": [
    {
      "id": "peer_xyz",
      "server_url": "https://novi-sad.obp.example",
      "server_name": "Novi Sad OBP",
      "status": "active",
      "trusted": true,
      "last_seen": "2026-03-16T10:00:00Z"
    }
  ]
}
```

Status should be `active`. If it's `pending`, check that Server B successfully received and processed the handshake.

## Step 4: Federated search

Now a client can search across both servers:

```bash
# Search for yoga services across all federated servers
curl "https://belgrade.obp.example/obp/v1/federation/search?q=yoga&category=sport"
```

```json
{
  "data": [
    {
      "service": { "id": "svc_yoga123", "name": "Morning Yoga", "duration_minutes": 60 },
      "provider": { "id": "prv_ns456", "name": "Yoga Studio NS" },
      "server_url": "https://novi-sad.obp.example",
      "server_name": "Novi Sad OBP"
    }
  ],
  "servers_queried": ["https://novi-sad.obp.example"],
  "servers_failed": []
}
```

## Step 5: Cross-server slot availability

Fetch slots for a service on Server B, via Server A:

```bash
curl "https://belgrade.obp.example/obp/v1/federation/slots?service_id=svc_yoga123&server=https://novi-sad.obp.example&from=2026-04-15&to=2026-04-22"
```

Server A proxies this request to Server B (with HTTP Signature authentication) and returns the results.

Alternatively, clients can call Server B directly (federation servers accept direct API calls too):

```bash
curl "https://novi-sad.obp.example/obp/v1/slots?service_id=svc_yoga123&from=2026-04-15&to=2026-04-22"
```

## Step 6: Cross-server hold and booking

Hold a slot on Server B:

```bash
# Direct to Server B
curl -X POST https://novi-sad.obp.example/obp/v1/slots/SLOT_ID/hold \
  -H "Content-Type: application/json" \
  -d '{"customer_email": "customer@example.com"}'
```

Create the booking on Server B (the booking lives on the server where the service is):

```bash
curl -X POST https://novi-sad.obp.example/obp/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "hold_id": "hold_from_server_b",
    "service_id": "svc_yoga123",
    "customer": {
      "name": "Ana Petrović",
      "email": "ana@example.com"
    }
  }'
```

The booking confirmation email comes from Server B. The customer's iCal link and cancellation URL also point to Server B.

## Step 7: Using the JavaScript SDK for federated booking

```typescript
import { OBPClient } from '@obp/client';

// Client for Server A (user's home server)
const serverA = new OBPClient({ baseUrl: 'https://belgrade.obp.example' });

// Search across federation
const results = await serverA.federation.search({ q: 'yoga', category: 'sport' });

// The result tells you which server has the service
const result = results.data[0]!;
console.log(result.serverUrl); // "https://novi-sad.obp.example"

// Connect to Server B for the actual booking
const serverB = new OBPClient({ baseUrl: result.serverUrl });

// Get slots from Server B
const slots = await serverB.slots.list({
  serviceId: result.service.id,
  from: '2026-04-15',
  to: '2026-04-22',
});

// Hold and book directly on Server B
const hold = await serverB.slots.hold(slots.data[0]!.id, {
  customerEmail: 'ana@example.com',
});

const booking = await serverB.bookings.create({
  holdId: hold.holdId,
  serviceId: result.service.id,
  customer: { name: 'Ana Petrović', email: 'ana@example.com' },
});
```

## Troubleshooting

### Peer status is "pending"

The handshake from Server A to Server B may have failed. Check Server B's logs:

```bash
docker compose -f docker-compose.prod.yml logs server | grep federation
```

Common causes:
- Server B's `FEDERATION_ENABLED` is not `true`
- Network firewall blocking the handshake
- TLS certificate issue on one server

### Signature verification failed

Check that both servers have correct time (NTP sync):

```bash
# On each server
date -u
timedatectl status
```

HTTP Signatures expire after 60 seconds, so clock skew > 30 seconds will cause failures.

### Cross-server bookings failing

Ensure both servers can reach each other over HTTPS. Test connectivity:

```bash
# From Server A, can it reach Server B?
curl -v https://novi-sad.obp.example/.well-known/obp

# From Server B, can it reach Server A?
curl -v https://belgrade.obp.example/.well-known/obp
```

## Running two servers locally for testing

Use ngrok or Tailscale to give each local server a public HTTPS URL:

```bash
# Terminal 1 — Server A on port 3001
PORT=3001 OBP_SERVER_URL=https://abc.ngrok.io npm run dev

# Terminal 2 — ngrok for Server A
ngrok http 3001

# Terminal 3 — Server B on port 3002
PORT=3002 OBP_SERVER_URL=https://xyz.ngrok.io npm run dev

# Terminal 4 — ngrok for Server B
ngrok http 3002
```

Then register each as a peer of the other using the ngrok URLs.
