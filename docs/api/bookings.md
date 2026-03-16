# Bookings API

## POST /obp/v1/bookings

Create a new booking. Requires a valid `hold_id` obtained from `POST /obp/v1/slots/:id/hold`.

**Authentication:** None required (public endpoint)

### Request body

```json
{
  "hold_id": "hold_abc123",
  "service_id": "svc_xyz789",
  "customer": {
    "name": "Ana Petrović",
    "email": "ana@example.com",
    "phone": "+381641234567"
  },
  "notes": "First visit, prefer gentle products"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `hold_id` | string | Yes | Hold ID from `POST /slots/:id/hold` |
| `service_id` | string | Yes | Must match the service for the hold |
| `customer.name` | string | Yes | Customer full name |
| `customer.email` | string | Yes | Customer email (confirmation sent here) |
| `customer.phone` | string | No | Customer phone number |
| `notes` | string | No | Notes for the provider (max 1000 chars) |

### Response `201 Created`

```json
{
  "id": "bkg_def456",
  "service_id": "svc_xyz789",
  "provider_id": "prv_abc123",
  "customer": {
    "name": "Ana Petrović",
    "email": "ana@example.com",
    "phone": "+381641234567"
  },
  "starts_at": "2026-04-15T10:00:00+02:00",
  "ends_at": "2026-04-15T11:00:00+02:00",
  "status": "confirmed",
  "notes": "First visit, prefer gentle products",
  "cancellation_url": "https://obp.example.com/obp/v1/bookings/bkg_def456/cancel",
  "ical_url": "https://obp.example.com/obp/v1/bookings/bkg_def456/ical",
  "created_at": "2026-04-15T09:05:00Z"
}
```

When the service has `requires_confirmation: true`, `status` is `pending`.

### Response `410 Gone`

```json
{
  "type": "https://obp.dev/errors/hold-expired",
  "title": "Hold Expired",
  "status": 410,
  "detail": "The slot hold has expired. Please select a new slot."
}
```

---

## GET /obp/v1/bookings/:id

Get booking details.

**Authentication:** None required (public endpoint)

### Response `200 OK`

Returns the [booking object](#post-obpv1bookings).

---

## POST /obp/v1/bookings/:id/cancel

Cancel a booking.

**Authentication:** None required (public endpoint)

### Request body

```json
{
  "reason": "Change of plans"
}
```

### Response `200 OK`

```json
{
  "id": "bkg_def456",
  "status": "cancelled",
  "cancelled_at": "2026-04-14T15:00:00Z",
  "cancellation_fee": {
    "amount": 125000,
    "currency": "RSD",
    "percent": 50,
    "reason": "Cancelled within 24 hours of appointment"
  }
}
```

`cancellation_fee` is only present if a fee applies per the service's `cancellation_policy`.

---

## GET /obp/v1/bookings/:id/ical

Download the booking as an iCal file (RFC 5545).

**Authentication:** None required

### Response `200 OK`

```
Content-Type: text/calendar; charset=utf-8
Content-Disposition: attachment; filename="booking-bkg_def456.ics"
```

---

## Provider endpoints (authenticated)

### GET /obp/v1/bookings

List all bookings for the authenticated provider.

**Authentication:** `X-Api-Key` with `read` scope

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `status` | string | Filter: `pending`, `confirmed`, `completed`, `cancelled`, `no_show` |
| `service_id` | string | Filter by service |
| `from` | string | Filter by start date (`YYYY-MM-DD`) |
| `to` | string | Filter by end date (`YYYY-MM-DD`) |
| `page` | integer | Page number |
| `per_page` | integer | Results per page (max: 100) |

### POST /obp/v1/bookings/:id/confirm

Confirm a pending booking.

**Authentication:** `X-Api-Key` with `write` scope

### Response `200 OK`

Returns the updated booking object with `status: "confirmed"`.

---

### POST /obp/v1/bookings/:id/complete

Mark a booking as completed (service rendered).

**Authentication:** `X-Api-Key` with `write` scope

### Response `200 OK`

Returns the updated booking object with `status: "completed"`.

---

### POST /obp/v1/bookings/:id/no-show

Mark a customer as a no-show.

**Authentication:** `X-Api-Key` with `write` scope

### Response `200 OK`

Returns the updated booking object with `status: "no_show"`.
