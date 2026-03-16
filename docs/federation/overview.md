# Federation Overview

OBP federation allows independent servers to discover each other and exchange bookings without a central authority.

## How it works

1. **Discovery** — Server A finds Server B via `.well-known/obp` or WebFinger
2. **Registration** — Servers exchange public keys and register as peers
3. **Search** — Server A can query Server B's services and availability
4. **Booking** — Server A creates a booking on Server B on behalf of its user
5. **Sync** — Servers periodically sync catalog changes

## Security

All cross-server HTTP requests are signed using **HTTP Signatures** (RFC 9421). Each server holds an Ed25519 key pair. The public key is published in the discovery document.

Receiving servers verify:
- The signature is valid for the sending server's public key
- The request hasn't been replayed (timestamp + nonce check)
- The sending server is a registered and trusted peer

## Discovery document

```bash
GET /.well-known/obp
```

```json
{
  "version": "1.0",
  "server": {
    "name": "My OBP Server",
    "url": "https://obp.example.com",
    "public_key": "ed25519:..."
  },
  "federation": {
    "enabled": true,
    "endpoints": {
      "search": "/obp/v1/federation/search",
      "slots": "/obp/v1/federation/slots",
      "book": "/obp/v1/federation/book"
    }
  }
}
```
