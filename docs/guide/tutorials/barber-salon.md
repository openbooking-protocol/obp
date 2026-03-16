# Tutorial: Barber / Hair Salon

This tutorial walks you through setting up OBP for a hair salon — one of the most common use cases. By the end, you'll have a working booking system with multiple services, staff-aware scheduling, and customer notifications.

## What we're building

**Salon Ivana** offers:
- Women's Haircut — 60 min, 2500 RSD
- Color Treatment — 120 min, 6000 RSD
- Beard Trim — 20 min, 800 RSD

Working hours: Monday–Saturday, 09:00–19:00

## Prerequisites

- OBP server running (see [Self-Hosting Guide](../self-hosting.md))
- Admin API key

## Step 1: Create the provider

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/providers \
  -H "X-Api-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salon Ivana",
    "description": "Modern hair salon in the center of Belgrade. Specializing in color treatments and cuts.",
    "category": "beauty",
    "location": {
      "address": "Knez Mihailova 10",
      "city": "Belgrade",
      "country": "RS",
      "latitude": 44.8176,
      "longitude": 20.4569
    },
    "timezone": "Europe/Belgrade",
    "contact": {
      "email": "ivana@salon.rs",
      "phone": "+381601234567",
      "website": "https://salon-ivana.rs"
    }
  }'
```

Save the `id` from the response: `prv_abc123`

## Step 2: Generate an API key for the salon

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/auth/keys \
  -H "X-Api-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": "prv_abc123",
    "scopes": ["read", "write"]
  }'
```

Store the returned `key` value securely. Use it for all subsequent requests as `X-Api-Key`.

## Step 3: Create services

### Women's Haircut

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/services \
  -H "X-Api-Key: SALON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Women'\''s Haircut",
    "description": "Wash, cut, and blowdry. Includes consultation.",
    "duration_minutes": 60,
    "buffer_after_minutes": 15,
    "price": { "amount": 250000, "currency": "RSD" },
    "max_participants": 1,
    "requires_confirmation": false,
    "cancellation_policy": { "deadline_hours": 24, "fee_percent": 50 },
    "tags": ["hair", "women", "cut", "blowdry"]
  }'
```

### Color Treatment

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/services \
  -H "X-Api-Key: SALON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Color Treatment",
    "description": "Full color, highlights, or balayage. Includes cut and blowdry.",
    "duration_minutes": 120,
    "buffer_after_minutes": 15,
    "price": { "amount": 600000, "currency": "RSD" },
    "max_participants": 1,
    "requires_confirmation": true,
    "cancellation_policy": { "deadline_hours": 48, "fee_percent": 100 },
    "tags": ["hair", "color", "highlights", "women"]
  }'
```

Note: `requires_confirmation: true` because color treatments need the stylist to confirm availability of the right products.

### Beard Trim

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/services \
  -H "X-Api-Key: SALON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Beard Trim",
    "description": "Beard shaping and trimming with hot towel finish.",
    "duration_minutes": 20,
    "buffer_after_minutes": 10,
    "price": { "amount": 80000, "currency": "RSD" },
    "max_participants": 1,
    "tags": ["beard", "men", "trim"]
  }'
```

## Step 4: Set up working hours

Configure the salon's weekly schedule:

```bash
curl -X PUT https://obp.yourdomain.com/obp/v1/schedule \
  -H "X-Api-Key: SALON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "type": "weekly",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        "start_time": "09:00",
        "end_time": "19:00"
      }
    ]
  }'
```

## Step 5: Add a holiday exception

Block off a national holiday:

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/schedule/exceptions \
  -H "X-Api-Key: SALON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-11-11",
    "reason": "Armistice Day — Closed",
    "available": false
  }'
```

## Step 6: Test the booking flow

### Find available slots

```bash
curl "https://obp.yourdomain.com/obp/v1/slots?service_id=SVC_HAIRCUT_ID&from=2026-04-15&to=2026-04-16"
```

### Hold a slot

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/slots/SLOT_ID/hold \
  -H "Content-Type: application/json" \
  -d '{"customer_email": "test@example.com"}'
```

### Create a booking

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "hold_id": "HOLD_ID",
    "service_id": "SVC_HAIRCUT_ID",
    "customer": {
      "name": "Marija Nikolić",
      "email": "marija@example.com",
      "phone": "+381641234567"
    }
  }'
```

The customer receives a confirmation email with the iCal link.

## Step 7: Embed a booking widget (optional)

Add the OBP booking widget to the salon website:

```html
<script src="https://cdn.jsdelivr.net/npm/@obp/widget@latest/dist/widget.js"></script>
<div
  id="obp-widget"
  data-server="https://obp.yourdomain.com"
  data-provider="prv_abc123"
  data-theme="light"
  data-locale="sr"
></div>
<script>
  OBPWidget.init('#obp-widget');
</script>
```

## Step 8: Manage bookings from the dashboard

Access the provider dashboard at `https://obp.yourdomain.com/dashboard` and log in with your API key. From there you can:

- View the booking calendar
- Confirm/reject color treatment requests
- Mark appointments as complete or no-show
- Export bookings to CSV

## Tips for hair salons

- **Buffer time**: Always add `buffer_after_minutes` (10–15 min) for cleanup and preparation
- **Color confirmation**: Use `requires_confirmation: true` for treatments with variable duration
- **Long cancellation deadline**: Color treatments often need 48h cancellation with 100% fee due to product preparation
- **Group cuts**: For group events or courses, use `max_participants > 1`
