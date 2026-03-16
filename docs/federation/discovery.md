# Federation Discovery

## How servers find each other

OBP federation uses a pull-based discovery model similar to WebFinger. Any OBP server can discover another by fetching its `/.well-known/obp` endpoint.

## The discovery document

Every OBP server MUST expose `GET /.well-known/obp` at its root domain:

```json
{
  "obp_version": "1.0.0",
  "server_url": "https://obp.example.com",
  "server_name": "Example Booking Platform",
  "federation_enabled": true,
  "public_key": "MCowBQYDK2VdAyEAaBcDeFgHiJkLmNoPqRsTuVwXyZ012345678901234567890AB==",
  "public_key_id": "https://obp.example.com/.well-known/obp#key",
  "features": ["bookings", "webhooks", "ical"],
  "contact": "admin@example.com"
}
```

This document MUST be:
- Served over HTTPS
- Accessible without authentication
- Respond within 5 seconds
- Have `Content-Type: application/json`

## Key requirements

The `public_key` field contains the server's Ed25519 public key encoded as:
- DER SubjectPublicKeyInfo format
- Base64 standard encoding (not URL-safe)

The `public_key_id` is a canonical URI used to reference the key in HTTP Signature headers. By convention it is `{server_url}/.well-known/obp#key`.

## Registering a peer

Manual peer registration is required before cross-server bookings can occur. An admin registers a remote server via the API:

```bash
curl -X POST https://my-server.example.com/obp/v1/federation/peers \
  -H "X-Api-Key: ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"server_url": "https://remote-server.example.com"}'
```

The registration process:

1. My server fetches `https://remote-server.example.com/.well-known/obp`
2. Validates the response (checks `obp_version`, `federation_enabled: true`, valid `public_key`)
3. Stores the peer with its public key
4. Sends a signed notification to `https://remote-server.example.com/obp/v1/federation/handshake`
5. The remote server may auto-register the caller or require manual approval (configurable)

## Peer states

| State | Description |
|---|---|
| `pending` | Handshake sent, awaiting reciprocal confirmation |
| `active` | Both servers have confirmed the peer relationship |
| `suspended` | Temporarily disabled (too many failures, admin action) |
| `rejected` | Rejected by remote server admin |

## Automatic peer discovery (optional)

When enabled, an OBP server can discover peers by crawling the `peers` field in discovery documents:

```json
{
  "obp_version": "1.0.0",
  "federation_enabled": true,
  "peers": [
    "https://another-server.example.com",
    "https://third-server.example.com"
  ]
}
```

Enable in `server/.env`:

```env
FEDERATION_AUTO_DISCOVER=false  # disabled by default for security
```

## Key caching

Fetched public keys are cached for **1 hour** to avoid repeated lookups on every request. To force a key refresh (e.g., after key rotation), the remote server sends a signed notification:

```
POST /obp/v1/federation/keys/refresh
```

## Testing federation locally

Use ngrok or Tailscale to expose your local server for federation testing:

```bash
# Start your server
npm run dev

# Expose it
ngrok http 3000

# Register the ngrok URL as a peer on another server
curl -X POST https://other-server.example.com/obp/v1/federation/peers \
  -H "X-Api-Key: ADMIN_KEY" \
  -d '{"server_url": "https://abc123.ngrok.io"}'
```

## Compliance validation

The OBP validator checks federation compliance:

```bash
npx @obp/validator https://obp.yourdomain.com --check-federation
```

Checks performed:
- `/.well-known/obp` responds with correct format
- `federation_enabled` field present
- `public_key` is valid Ed25519 key (when federation enabled)
- HTTPS certificate valid
- Response time < 5 seconds
