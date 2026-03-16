# Slots API

## GET /obp/v1/slots

List available slots for a service.

**Authentication:** None required

### Query parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `service_id` | string | Yes | Service to get slots for |
| `from` | string | Yes | Start date (`YYYY-MM-DD`) |
| `to` | string | Yes | End date inclusive (`YYYY-MM-DD`, max range: 60 days) |
| `timezone` | string | No | IANA timezone for date interpretation (default: provider timezone) |

### Response `200 OK`

```json
{
  "data": [
    {
      "id": "slot_20260415T100000_svc_xyz789",
      "service_id": "svc_xyz789",
      "provider_id": "prv_abc123",
      "starts_at": "2026-04-15T10:00:00+02:00",
      "ends_at": "2026-04-15T11:00:00+02:00",
      "available": true,
      "remaining_capacity": 1
    },
    {
      "id": "slot_20260415T110000_svc_xyz789",
      "service_id": "svc_xyz789",
      "provider_id": "prv_abc123",
      "starts_at": "2026-04-15T11:15:00+02:00",
      "ends_at": "2026-04-15T12:15:00+02:00",
      "available": false,
      "remaining_capacity": 0
    }
  ],
  "meta": {
    "total": 28,
    "from": "2026-04-15",
    "to": "2026-04-22",
    "service_id": "svc_xyz789"
  }
}
```

### Slot ID format

Slot IDs are deterministic: `slot_{ISO8601_start}_{service_id}`

The ISO 8601 timestamp uses the format `YYYYMMDDTHHmmss` (no separators) in the provider's local timezone. This makes slot IDs stable across requests.

### Response `422 Unprocessable Entity`

```json
{
  "type": "https://obp.dev/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "The 'from' date must be today or in the future",
  "errors": [
    { "field": "from", "message": "Must be today or in the future" }
  ]
}
```

---

## POST /obp/v1/slots/:id/hold

Hold a slot to temporarily reserve it during checkout.

**Authentication:** None required

### Request body

```json
{
  "customer_email": "ana@example.com"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `customer_email` | string | No | Used to associate hold with a customer (for idempotency) |

### Response `201 Created`

```json
{
  "hold_id": "hold_abc123",
  "slot_id": "slot_20260415T100000_svc_xyz789",
  "service_id": "svc_xyz789",
  "starts_at": "2026-04-15T10:00:00+02:00",
  "ends_at": "2026-04-15T11:00:00+02:00",
  "expires_at": "2026-04-15T09:10:00Z",
  "ttl_seconds": 600
}
```

### Response `409 Conflict`

```json
{
  "type": "https://obp.dev/errors/slot-unavailable",
  "title": "Slot Unavailable",
  "status": 409,
  "detail": "This slot is no longer available"
}
```

---

## DELETE /obp/v1/slots/:id/hold/:holdId

Release a hold before it expires (e.g., if user navigates away).

**Authentication:** None required

### Response `204 No Content`
