# ADR-0004: Use HTTP Signatures for federation authentication

**Date:** 2026-03-16
**Status:** Accepted

---

## Context

Cross-server federation requests must be authenticated so a receiving server can verify that the request genuinely comes from a registered peer and has not been tampered with or replayed.

## Decision

Use **HTTP Message Signatures (RFC 9421)** with **Ed25519** key pairs. Each OBP server publishes its public key in `/.well-known/obp`. All outbound federation HTTP requests include a `Signature` header. Receiving servers verify against the sender's registered public key.

## Rationale

- RFC 9421 is the current IETF standard (supersedes the draft used by ActivityPub)
- Ed25519 is fast, small keys, strong security
- Request-level signing means any HTTPS proxy can forward requests without breaking auth
- Proven pattern in the Fediverse (ActivityPub, Mastodon)
- Replay protection via timestamp + nonce included in the signed components

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Shared secret / HMAC per peer | Doesn't scale — each peer pair needs a unique secret |
| mTLS | Complex certificate management; overkill for this use case |
| OAuth2 client credentials between peers | Heavier; requires token endpoint and token lifecycle management |
| API keys per peer | No replay protection; key rotation is cumbersome |

## Consequences

### Positive
- Stateless verification — no session state needed between requests
- Standard, auditable, well-understood

### Negative / trade-offs
- Key rotation requires re-registration with all peers
- `jose` library used for Ed25519 operations — adds a dependency
