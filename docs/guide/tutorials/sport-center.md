# Tutorial: Sports Center / Court Booking

This tutorial covers setting up OBP for a sports center with multiple courts and a group class schedule — a more complex scenario demonstrating resources, group bookings, and capacity management.

## What we're building

**Belgrade Sport Center** offers:
- Tennis Court 1 — 60 min slots, 800 RSD/h
- Tennis Court 2 — 60 min slots, 800 RSD/h
- Padel Court — 90 min slots, 1200 RSD
- Morning Yoga Class — 60 min, max 12 participants
- HIIT Training — 45 min, max 20 participants

## Step 1: Create the provider

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/providers \
  -H "X-Api-Key: ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Belgrade Sport Center",
    "description": "Indoor and outdoor courts, fitness classes, and personal training in Novi Beograd.",
    "category": "sport",
    "location": {
      "address": "Bulevar Mihajla Pupina 165",
      "city": "Belgrade",
      "country": "RS",
      "latitude": 44.8206,
      "longitude": 20.4250
    },
    "timezone": "Europe/Belgrade",
    "contact": {
      "email": "info@bgdsporthall.rs",
      "phone": "+381111234567"
    }
  }'
```

## Step 2: Create resources (courts)

Resources represent physical assets that can be booked:

```bash
# Tennis Court 1
curl -X POST https://obp.yourdomain.com/obp/v1/resources \
  -H "X-Api-Key: SPORT_CENTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tennis Court 1",
    "description": "Hard surface, indoor",
    "type": "court"
  }'

# Tennis Court 2
curl -X POST https://obp.yourdomain.com/obp/v1/resources \
  -H "X-Api-Key: SPORT_CENTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tennis Court 2",
    "description": "Hard surface, outdoor",
    "type": "court"
  }'

# Padel Court
curl -X POST https://obp.yourdomain.com/obp/v1/resources \
  -H "X-Api-Key: SPORT_CENTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Padel Court",
    "description": "Enclosed padel court, lights included",
    "type": "court"
  }'
```

## Step 3: Create services

### Tennis Court Booking (links to a resource)

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/services \
  -H "X-Api-Key: SPORT_CENTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tennis Court 1",
    "description": "1-hour tennis court rental, indoor hard surface.",
    "duration_minutes": 60,
    "price": { "amount": 80000, "currency": "RSD" },
    "max_participants": 4,
    "requires_confirmation": false,
    "resource_id": "TENNIS_COURT_1_ID",
    "tags": ["tennis", "court", "indoor"]
  }'
```

### Group Yoga Class

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/services \
  -H "X-Api-Key: SPORT_CENTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Yoga",
    "description": "60-minute vinyasa yoga flow. All levels welcome. Bring your own mat.",
    "duration_minutes": 60,
    "buffer_before_minutes": 10,
    "buffer_after_minutes": 10,
    "price": { "amount": 150000, "currency": "RSD" },
    "max_participants": 12,
    "requires_confirmation": false,
    "cancellation_policy": { "deadline_hours": 2, "fee_percent": 100 },
    "tags": ["yoga", "group", "fitness", "morning"]
  }'
```

### HIIT Training

```bash
curl -X POST https://obp.yourdomain.com/obp/v1/services \
  -H "X-Api-Key: SPORT_CENTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HIIT Training",
    "description": "High-intensity interval training. 45 minutes. All fitness levels.",
    "duration_minutes": 45,
    "buffer_before_minutes": 5,
    "buffer_after_minutes": 15,
    "price": { "amount": 120000, "currency": "RSD" },
    "max_participants": 20,
    "tags": ["hiit", "cardio", "group", "fitness"]
  }'
```

## Step 4: Set up the weekly class schedule

For group classes with fixed times (not on-demand slots), use schedule rules with specific times:

```bash
curl -X PUT https://obp.yourdomain.com/obp/v1/schedule \
  -H "X-Api-Key: SPORT_CENTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "type": "weekly",
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        "start_time": "06:00",
        "end_time": "23:00"
      }
    ]
  }'
```

For yoga and HIIT with fixed class times, create specific schedule rules per service:

```bash
curl -X PUT https://obp.yourdomain.com/obp/v1/services/YOGA_SERVICE_ID/schedule \
  -H "X-Api-Key: SPORT_CENTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "type": "weekly",
        "days": ["monday", "wednesday", "friday"],
        "start_time": "07:00",
        "end_time": "08:00"
      },
      {
        "type": "weekly",
        "days": ["saturday", "sunday"],
        "start_time": "09:00",
        "end_time": "10:00"
      }
    ]
  }'
```

## Step 5: Understanding group booking capacity

For `max_participants > 1`, multiple customers can book the same slot simultaneously until capacity is reached:

```bash
# Customer 1 books yoga at 07:00
curl -X POST https://obp.yourdomain.com/obp/v1/bookings \
  -d '{"hold_id": "...", "service_id": "...", "customer": {...}}'
# remaining_capacity: 11

# Customer 2 books the same slot
curl -X POST https://obp.yourdomain.com/obp/v1/bookings \
  -d '{"hold_id": "...", "service_id": "...", "customer": {...}}'
# remaining_capacity: 10

# When 12 participants book, the slot becomes unavailable
```

## Step 6: Check availability

Get slots for all tennis courts in a date range:

```bash
# Court 1
curl "https://obp.yourdomain.com/obp/v1/slots?service_id=TENNIS1_SVC_ID&from=2026-04-15&to=2026-04-15"

# Court 2
curl "https://obp.yourdomain.com/obp/v1/slots?service_id=TENNIS2_SVC_ID&from=2026-04-15&to=2026-04-15"
```

Or search all sport center services at once:

```bash
curl "https://obp.yourdomain.com/obp/v1/slots?provider_id=prv_sport123&from=2026-04-15&to=2026-04-15"
```

## Step 7: Booking a court

```bash
# Hold the 14:00 slot on Tennis Court 1
curl -X POST https://obp.yourdomain.com/obp/v1/slots/SLOT_ID/hold \
  -d '{"customer_email": "player@example.com"}'

# Create the booking
curl -X POST https://obp.yourdomain.com/obp/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "hold_id": "hold_abc",
    "service_id": "TENNIS1_SVC_ID",
    "customer": {
      "name": "Nikola Jovanović",
      "email": "nikola@example.com",
      "phone": "+381641234567"
    },
    "notes": "Need ball machine setup"
  }'
```

## Tips for sports centers

- **Courts vs classes**: Use `max_participants: 4` for courts (max players), `max_participants: 12` for classes
- **Buffer time for group classes**: Use `buffer_before_minutes` for room setup and `buffer_after_minutes` for cleanup
- **Last-minute policy**: Set `cancellation_policy.deadline_hours: 2` for group classes so spots can be filled
- **Lights/equipment**: Use the `notes` field to capture extra customer requests
- **Recurring bookings**: Players who book the same court every week can use webhooks on the client side to pre-book automatically
