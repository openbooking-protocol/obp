# Slots & Bookings

## How slots work

A **slot** is an available time window for a specific service. OBP generates slots dynamically based on the provider's schedule and existing bookings — they are not stored as individual records.

When you request slots, the server:
1. Reads the service's schedule rules (working hours, recurrence)
2. Subtracts blocked times (existing bookings, buffer times, exceptions)
3. Returns available windows for the requested date range

### Slot object

```json
{
  "id": "slot_20260415T100000_svc_xyz789",
  "service_id": "svc_xyz789",
  "provider_id": "prv_abc123",
  "starts_at": "2026-04-15T10:00:00+02:00",
  "ends_at": "2026-04-15T11:00:00+02:00",
  "available": true,
  "remaining_capacity": 1
}
```

Slot IDs encode the service and start time, making them deterministic and cacheable.

### Querying slots

```bash
curl "https://obp.example.com/obp/v1/slots?service_id=svc_xyz789&from=2026-04-15&to=2026-04-22"
```

Parameters:

| Parameter | Required | Description |
|---|---|---|
| `service_id` | Yes | Filter by service |
| `from` | Yes | Start date (ISO 8601, `YYYY-MM-DD`) |
| `to` | Yes | End date (inclusive) |
| `timezone` | No | IANA timezone for date interpretation (default: provider's timezone) |

Response:

```json
{
  "data": [
    {
      "id": "slot_20260415T100000_svc_xyz789",
      "service_id": "svc_xyz789",
      "starts_at": "2026-04-15T10:00:00+02:00",
      "ends_at": "2026-04-15T11:00:00+02:00",
      "available": true,
      "remaining_capacity": 1
    }
  ],
  "meta": {
    "total": 14,
    "from": "2026-04-15",
    "to": "2026-04-22"
  }
}
```

## Slot holds

Before creating a booking, you must **hold** a slot. This temporarily reserves the slot for a short period (default: 10 minutes) to prevent double-booking during the checkout process.

```bash
curl -X POST https://obp.example.com/obp/v1/slots/slot_20260415T100000_svc_xyz789/hold \
  -H "Content-Type: application/json" \
  -d '{"customer_email": "customer@example.com"}'
```

Response:

```json
{
  "hold_id": "hold_abc123",
  "slot_id": "slot_20260415T100000_svc_xyz789",
  "expires_at": "2026-04-15T09:10:00Z",
  "ttl_seconds": 600
}
```

::: warning Hold expiration
Holds expire after `ttl_seconds`. If you don't complete the booking before then, the slot is released. Your UI should display a countdown and warn users when time is running low.
:::

## Creating a booking

Once you have a `hold_id`, create the booking:

```bash
curl -X POST https://obp.example.com/obp/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "hold_id": "hold_abc123",
    "service_id": "svc_xyz789",
    "customer": {
      "name": "Ana Petrović",
      "email": "ana@example.com",
      "phone": "+381641234567"
    },
    "notes": "First visit"
  }'
```

Response (201 Created):

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
  "notes": "First visit",
  "cancellation_url": "https://obp.example.com/obp/v1/bookings/bkg_def456/cancel",
  "ical_url": "https://obp.example.com/obp/v1/bookings/bkg_def456/ical",
  "created_at": "2026-04-15T09:05:00Z"
}
```

### Booking status values

| Status | Description |
|---|---|
| `pending` | Awaiting provider confirmation (when `requires_confirmation: true`) |
| `confirmed` | Booking is confirmed and active |
| `completed` | Service has been rendered |
| `cancelled` | Cancelled by customer or provider |
| `no_show` | Customer did not appear |

### Booking state machine

```
                    [requires_confirmation: false]
                    ┌────────────────────────────────┐
                    ▼                                │
hold_id ──▶ [pending] ──confirm──▶ [confirmed] ──complete──▶ [completed]
                │                      │
                │                      └──cancel──▶ [cancelled]
                │
                └──reject──▶ [cancelled]
                └──expire──▶ (slot released, booking not created)
```

## Retrieving a booking

Bookings can be retrieved without authentication (public endpoint):

```bash
curl https://obp.example.com/obp/v1/bookings/bkg_def456
```

This allows customers to check their booking status using a link in their confirmation email.

## Cancelling a booking

```bash
curl -X POST https://obp.example.com/obp/v1/bookings/bkg_def456/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Change of plans"}'
```

::: info Cancellation fees
If the service has a `cancellation_policy` with a `deadline_hours`, cancellations after the deadline incur a `fee_percent` charge. The response will include `cancellation_fee` details when applicable.
:::

## iCal / calendar export

Every booking has an `ical_url` that returns a `.ics` file compatible with Google Calendar, Apple Calendar, and Outlook:

```bash
curl https://obp.example.com/obp/v1/bookings/bkg_def456/ical
# Returns: text/calendar (RFC 5545)
```

## Provider booking management

Providers use authenticated endpoints to manage bookings:

### List bookings

```bash
curl https://obp.example.com/obp/v1/bookings \
  -H "X-Api-Key: obpk_..."
```

Query parameters: `status`, `service_id`, `from`, `to`, `page`, `per_page`.

### Confirm a booking (when requires_confirmation: true)

```bash
curl -X POST https://obp.example.com/obp/v1/bookings/bkg_def456/confirm \
  -H "X-Api-Key: obpk_..."
```

### Mark as completed

```bash
curl -X POST https://obp.example.com/obp/v1/bookings/bkg_def456/complete \
  -H "X-Api-Key: obpk_..."
```

### Mark as no-show

```bash
curl -X POST https://obp.example.com/obp/v1/bookings/bkg_def456/no-show \
  -H "X-Api-Key: obpk_..."
```

## Webhooks

Subscribe to booking events to receive real-time notifications:

```bash
curl -X POST https://obp.example.com/obp/v1/webhooks \
  -H "X-Api-Key: obpk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhooks/obp",
    "events": ["booking.created", "booking.cancelled", "booking.confirmed"]
  }'
```

Webhook payload:

```json
{
  "id": "evt_ghi789",
  "event": "booking.created",
  "created_at": "2026-04-15T09:05:00Z",
  "data": {
    "booking": { "id": "bkg_def456", "..." }
  }
}
```

Available events: `booking.created`, `booking.confirmed`, `booking.cancelled`, `booking.completed`, `booking.no_show`.

Webhook requests include an `X-OBP-Signature` header (HMAC-SHA256 of the payload) for verification.
