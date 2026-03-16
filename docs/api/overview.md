# API Overview

The OBP API follows REST conventions and uses JSON. All endpoints are versioned under `/obp/v1/`.

## Base URL

```
https://your-obp-server.example.com/obp/v1
```

## Authentication

| Method | Usage |
|--------|-------|
| API Key | Provider management endpoints (`X-Api-Key: <key>`) |
| Bearer token | OAuth2 for end-user actions (`Authorization: Bearer <token>`) |
| None | Public read endpoints (services, slots discovery) |

## Error format

All errors follow [RFC 7807](https://datatracker.ietf.org/doc/html/rfc7807):

```json
{
  "type": "https://obp.dev/errors/slot-unavailable",
  "title": "Slot is no longer available",
  "status": 409,
  "detail": "Slot slt_abc123 was booked by another customer.",
  "instance": "/obp/v1/bookings"
}
```

## Pagination

List endpoints support cursor-based pagination:

```
GET /obp/v1/services?limit=20&cursor=<opaque_cursor>
```

Response includes:

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTAwfQ==",
    "has_more": true
  }
}
```

## Rate limiting

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Requests allowed per window |
| `X-RateLimit-Remaining` | Requests remaining |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

## Endpoints

| Group | Endpoints |
|-------|-----------|
| [Discovery](/api/discovery) | `.well-known/obp`, providers |
| [Services](/api/services) | List, get services |
| [Slots](/api/slots) | List, hold slots |
| [Bookings](/api/bookings) | Create, confirm, cancel bookings |
| [Webhooks](/api/webhooks) | Register and manage webhooks |
