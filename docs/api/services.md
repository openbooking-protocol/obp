# Services API

## GET /obp/v1/services

List all active services across all providers.

**Authentication:** None required

### Query parameters

| Parameter | Type | Description |
|---|---|---|
| `provider_id` | string | Filter by provider |
| `category` | string | Filter by provider category |
| `q` | string | Search by name/description |
| `active` | boolean | Filter by active status (default: `true`) |
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Results per page (default: 20, max: 100) |

### Response `200 OK`

```json
{
  "data": [
    {
      "id": "svc_xyz789",
      "provider_id": "prv_abc123",
      "name": "Women's Haircut",
      "description": "Wash, cut, and blowdry.",
      "duration_minutes": 60,
      "buffer_before_minutes": 0,
      "buffer_after_minutes": 15,
      "price": {
        "amount": 250000,
        "currency": "RSD"
      },
      "max_participants": 1,
      "requires_confirmation": false,
      "cancellation_policy": {
        "deadline_hours": 24,
        "fee_percent": 50
      },
      "tags": ["hair", "women", "cut"],
      "active": true
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "per_page": 20,
    "pages": 3
  }
}
```

---

## GET /obp/v1/services/:id

Get a single service by ID.

**Authentication:** None required

### Response `200 OK`

Returns the [service object](#get-obpv1services).

### Response `404 Not Found`

```json
{
  "type": "https://obp.dev/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Service svc_xyz789 not found"
}
```

---

## POST /obp/v1/services

Create a new service.

**Authentication:** `X-Api-Key` with `write` scope

### Request body

```json
{
  "name": "Women's Haircut",
  "description": "Wash, cut, and blowdry.",
  "duration_minutes": 60,
  "buffer_before_minutes": 0,
  "buffer_after_minutes": 15,
  "price": {
    "amount": 250000,
    "currency": "RSD"
  },
  "max_participants": 1,
  "requires_confirmation": false,
  "cancellation_policy": {
    "deadline_hours": 24,
    "fee_percent": 50
  },
  "tags": ["hair", "women", "cut"]
}
```

### Validation

| Field | Rules |
|---|---|
| `name` | Required, 1–200 chars |
| `duration_minutes` | Required, integer, 1–1440 |
| `buffer_before_minutes` | Optional, integer ≥ 0 (default: 0) |
| `buffer_after_minutes` | Optional, integer ≥ 0 (default: 0) |
| `price.amount` | Required, integer > 0 (minor currency units) |
| `price.currency` | Required, ISO 4217 code |
| `max_participants` | Optional, integer ≥ 1 (default: 1) |
| `cancellation_policy.deadline_hours` | Optional, integer ≥ 0 |
| `cancellation_policy.fee_percent` | Optional, integer 0–100 |

### Response `201 Created`

Returns the created service object.

---

## PATCH /obp/v1/services/:id

Update a service. Only provided fields are updated.

**Authentication:** `X-Api-Key` with `write` scope

### Request body

Any subset of the service fields (same validation rules as POST).

### Response `200 OK`

Returns the updated service object.

---

## DELETE /obp/v1/services/:id

Deactivate a service (`active: false`). Services are never hard-deleted to preserve booking history.

**Authentication:** `X-Api-Key` with `write` scope

### Response `204 No Content`
