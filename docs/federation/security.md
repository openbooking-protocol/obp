# Federation Security

## Authentication model

All server-to-server requests in OBP federation are authenticated using **HTTP Signatures** (RFC 9421) with **Ed25519** asymmetric keys. This provides:

- **Non-repudiation**: Requests are cryptographically tied to the sending server
- **Integrity**: The signature covers the request body, preventing tampering
- **No shared secrets**: Each server holds only its own private key

## Key management

### Key generation

On first start (or when `FEDERATION_PRIVATE_KEY` is not set), the server auto-generates an Ed25519 key pair:

```bash
# Keys are stored in the database and the private key in environment/secrets
# To inspect the current public key:
curl https://obp.example.com/.well-known/obp | jq .public_key
```

To generate a key pair manually:

```bash
# Generate private key (keep secret!)
openssl genpkey -algorithm ed25519 -out federation.pem

# Extract public key
openssl pkey -in federation.pem -pubout -outform DER | base64

# Set in .env
FEDERATION_PRIVATE_KEY=$(openssl pkey -in federation.pem -outform DER | base64)
```

### Key rotation

Rotate keys periodically (recommended: every 6–12 months) or immediately if compromised:

```bash
curl -X POST https://obp.example.com/obp/v1/federation/keys/rotate \
  -H "X-Api-Key: ADMIN_KEY"
```

Rotation process:
1. New key pair generated
2. `/.well-known/obp` updated with new public key
3. Old key remains valid for 24 hours (grace period)
4. All peers notified via signed `POST /obp/v1/federation/keys/refresh`
5. Old key disabled after grace period

## HTTP Signature details

### Signing a request

Signed components:
- `@method` — HTTP method
- `@target-uri` — Full request URI
- `content-digest` — SHA-256 hash of request body (for requests with bodies)
- `date` — Request date (prevents replay attacks)

```http
POST /obp/v1/bookings HTTP/1.1
Host: remote-server.example.com
Date: Mon, 16 Mar 2026 10:00:00 GMT
Content-Type: application/json
Content-Digest: sha-256=:K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=:
Signature-Input: sig1=("@method" "@target-uri" "content-digest" "date");keyid="https://my-server.example.com/.well-known/obp#key";alg="ed25519";created=1742119200;expires=1742119260
Signature: sig1=:MEYCIQDhYl...:

{"hold_id": "hold_abc123", "customer": {...}}
```

### Signature validity window

Signatures expire after **60 seconds** (`expires` parameter). Requests with:
- Missing `date` header → rejected
- `date` skew > 30 seconds from server time → rejected
- Expired `expires` → rejected

### Verifying a request

On the receiving end:

1. Parse `Signature-Input` to get `keyid`, `alg`, `created`, `expires`
2. Reject if `alg` ≠ `ed25519`
3. Reject if `expires` is in the past
4. Fetch public key from `keyid` URL (or use cache)
5. Reconstruct signing base string from covered components
6. Verify Ed25519 signature

## Threat model

### Replay attacks

Mitigated by:
- Short signature expiry (60 seconds)
- `date` header validation with 30-second skew tolerance
- Request IDs stored in Redis for deduplication during the signature validity window

### Man-in-the-middle

Mitigated by:
- HTTPS required for all federation endpoints
- Signature verification ensures even if TLS is broken, content can't be modified

### Compromised peer

If a peer server is compromised:

1. Suspend the peer immediately:
   ```bash
   curl -X PATCH https://obp.example.com/obp/v1/federation/peers/peer_xyz \
     -H "X-Api-Key: ADMIN_KEY" \
     -d '{"status": "suspended"}'
   ```

2. The peer's cached public key is invalidated
3. All requests from that peer's key are rejected

### Key impersonation

An attacker cannot impersonate a server without its private key. The private key must be:
- Stored securely (secrets manager, not in source code)
- Never transmitted over the network
- Rotated immediately if exposed

## TLS requirements

Federation endpoints MUST use TLS 1.2 or higher with a valid certificate from a trusted CA. Self-signed certificates are rejected unless `FEDERATION_ALLOW_SELF_SIGNED=true` (for local development only).

## Rate limiting

Federation endpoints are rate-limited per peer server (identified by source IP + key ID):

| Limit | Value |
|---|---|
| Default max requests | 1000 per hour per peer |
| Hold creation | 60 per hour per peer |
| Booking creation | 30 per hour per peer |

Configure in `server/.env`:

```env
FEDERATION_RATE_LIMIT_MAX=1000
FEDERATION_RATE_LIMIT_WINDOW=3600
```

## Audit logging

All federation activity is logged when `AUDIT_LOG_ENABLED=true`:

- Peer registration/removal
- Key rotation events
- Incoming signed requests (peer ID, endpoint, timestamp)
- Failed signature verifications (potential attack indicator)

```bash
# View federation audit log
curl https://obp.example.com/obp/v1/admin/audit?type=federation \
  -H "X-Api-Key: ADMIN_KEY"
```
