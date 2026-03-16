# OBP Security Model — Specification

**Version:** 1.0.0-draft

---

## 1. Authentication

### 1.1 API Keys

API keys authenticate provider management operations.

**Format:** `obpk_<32-char-base62-random>`

**Storage:** Keys are stored as `bcrypt(key, cost=12)`. The plaintext is shown only at creation time.

**Scopes:**
- `read` — GET endpoints only
- `write` — all mutating endpoints
- `admin` — server-wide operations (create providers, manage peers)

**Transmission:** Keys MUST be sent via the `X-Api-Key` header over HTTPS only.

**Rotation:** Providers can rotate keys via the dashboard. Old key is invalidated immediately.

### 1.2 OAuth2 + PKCE

End-user sessions use OAuth2 Authorization Code flow with PKCE ([RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)).

**Flow:**
1. Client generates `code_verifier` (32-byte random, base64url-encoded)
2. Client computes `code_challenge = BASE64URL(SHA256(code_verifier))`
3. Client redirects to `/oauth/authorize?response_type=code&code_challenge=...&code_challenge_method=S256`
4. After user authentication, server issues authorization code
5. Client exchanges code + `code_verifier` for access token at `/oauth/token`
6. Server verifies: `BASE64URL(SHA256(code_verifier)) == code_challenge`

PKCE is REQUIRED for all OBP OAuth2 flows. `code_challenge_method=plain` is NOT supported.

**Token format:** JWT (RS256 or ES256), signed by the server.

**Token lifetime:**
- Access token: 1 hour
- Refresh token: 30 days (rotated on each use)

### 1.3 HTTP Signatures (federation)

See `federation.md §4`. Ed25519 signatures on all server-to-server requests.

---

## 2. Authorization (RBAC)

### 2.1 Roles

| Role | Description |
|------|-------------|
| `server_admin` | Full server access. Manage providers, peers, server settings. |
| `provider_owner` | Full access to their provider's data. |
| `provider_staff` | Read access + limited write (confirm/complete bookings). |

### 2.2 Resource ownership

- Providers can only access their own services, resources, bookings, and webhooks
- Ownership is checked on every mutating request: `booking.provider_id == authenticated_provider_id`
- Cross-provider access requires `server_admin` scope

### 2.3 Customer access

Customers authenticate booking-specific actions by providing the booking ID + their email address. No account is required to create or cancel a booking.

---

## 3. Transport security

- All endpoints MUST be served over HTTPS (TLS 1.2 minimum, TLS 1.3 recommended)
- HSTS header SHOULD be set: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- HTTP Strict Transport Security (HSTS) preloading RECOMMENDED for production
- HTTP (non-TLS) is only allowed for local development (`NODE_ENV=development`)

---

## 4. Input validation

### 4.1 Schema validation

All request bodies are validated against the OpenAPI schema (Zod in the reference implementation) before processing. Invalid requests return `422` with field-level error details.

### 4.2 SQL injection prevention

The reference implementation uses parameterized queries exclusively (Drizzle ORM). Raw SQL is never constructed from user input.

### 4.3 XSS prevention

- All string fields are stored and returned without HTML encoding (API is not a browser context)
- The frontend MUST escape all user-generated content before rendering (React does this by default)
- `Content-Type: application/json` on all API responses prevents MIME sniffing

### 4.4 Request size limits

- Request body: max 100KB
- Individual string fields: per-field limits enforced by schema validation
- File uploads (logo): max 5MB, MIME type validation (`image/jpeg`, `image/png`, `image/webp`)

---

## 5. Rate limiting

See `protocol.md §7`. Implemented via Redis sliding window counter.

**Anti-abuse measures:**
- Booking creation: max 20/min per IP (unauthenticated)
- Hold creation: max 10/min per IP
- Repeated 409 (slot conflicts) from same IP: exponential backoff warning, eventual 429
- Federation: per-peer rate limiting based on trust level

---

## 6. Webhook security

### 6.1 Signature verification

Every webhook delivery includes:
```
X-OBP-Signature: sha256=<hex(HMAC-SHA256(body, secret))>
```

Receivers MUST verify this signature before processing the payload. Use a constant-time comparison to prevent timing attacks.

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhookSignature(body: string, secret: string, header: string): boolean {
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  return timingSafeEqual(Buffer.from(expected), Buffer.from(header));
}
```

### 6.2 Delivery security

- Webhook URLs MUST use HTTPS in production
- Server follows up to 3 redirects; redirect destinations MUST also use HTTPS
- Webhook payloads do not include customer PII beyond what the provider already has

---

## 7. Data protection

### 7.1 Customer data

- Customer data (name, email, phone) is stored only in Booking records
- No customer accounts or profiles in v1 (privacy by design)
- Email is used for booking lookup only; not shared with third parties

### 7.2 Federated data minimization

- Sync endpoints NEVER include customer data
- Federated bookings transmit only: name, email, optional phone
- Originating server URL is stored for reconciliation but not displayed to customers

### 7.3 Data retention

- Cancelled bookings: retained for 2 years (legal requirement in many jurisdictions)
- Completed bookings: retained for 5 years
- Providers may request deletion (server admin function)
- Soft deletion (status change) used for bookings; hard deletion for providers/services

---

## 8. OWASP Top 10 mitigations

| Risk | Mitigation |
|------|-----------|
| A01 Broken Access Control | RBAC + resource ownership checks on every request |
| A02 Cryptographic Failures | TLS required; bcrypt for keys; Ed25519 for federation |
| A03 Injection | Parameterized queries (Drizzle); schema validation (Zod) |
| A04 Insecure Design | Spec-first; threat modeling per entity |
| A05 Security Misconfiguration | `NODE_ENV` check; CORS allowlist; security headers |
| A06 Vulnerable Components | `npm audit` in CI; Dependabot alerts |
| A07 Auth Failures | Short-lived JWT; PKCE; bcrypt API keys; rate limiting |
| A08 Integrity Failures | HTTP Signatures for federation; webhook HMAC |
| A09 Logging Failures | Structured pino logs; request ID tracking; no PII in logs |
| A10 SSRF | Webhook URL allowlist check; no internal IP ranges |

---

## 9. Security response

Security vulnerabilities should be reported via GitHub Security Advisories at:
`https://github.com/openbooking-protocol/obp/security/advisories`

Do not open public GitHub issues for security vulnerabilities.
