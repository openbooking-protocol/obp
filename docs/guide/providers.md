# Providers & Services

## Providers

A **Provider** is a business or individual offering bookable services. Examples:
- A hair salon
- A physiotherapy clinic
- A sports center with multiple courts
- A freelance consultant

### Provider object

```json
{
  "id": "prv_abc123",
  "name": "Salon Ivana",
  "description": "Modern hair salon in the center of Belgrade.",
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
  },
  "logo_url": "https://salon-ivana.rs/logo.png",
  "status": "active",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-03-01T14:30:00Z"
}
```

### Provider categories

| Category | Examples |
|---|---|
| `health` | Medical, physiotherapy, dentistry, psychology |
| `beauty` | Hair, nails, massage, skin care |
| `sport` | Tennis, padel, yoga, personal training |
| `education` | Tutoring, language lessons, music lessons |
| `professional` | Consulting, legal, accounting, coaching |
| `other` | Photography, repairs, pet grooming |

### Creating a provider

```bash
curl -X POST https://obp.example.com/obp/v1/providers \
  -H "X-Api-Key: ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salon Ivana",
    "description": "Modern hair salon in Belgrade.",
    "category": "beauty",
    "location": {
      "address": "Knez Mihailova 10",
      "city": "Belgrade",
      "country": "RS"
    },
    "timezone": "Europe/Belgrade",
    "contact": { "email": "ivana@salon.rs" }
  }'
```

## Services

A **Service** is a specific offering by a provider. A hair salon might have:
- "Women's Haircut" — 60 min, 2500 RSD
- "Color Treatment" — 120 min, 6000 RSD
- "Beard Trim" — 20 min, 800 RSD

### Service object

```json
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
```

::: info Price is in minor units
`amount` is in the smallest currency unit: cents for EUR, para for RSD, pence for GBP. 250000 RSD = 2,500.00 RSD.
:::

### Buffer times

`buffer_before_minutes` and `buffer_after_minutes` add preparation/cleanup time around the service. This time is blocked for other bookings but not visible to customers.

For example, a 60-minute massage with 15 minutes cleanup:
- Customer sees: 60 minutes
- Slot blocked: 75 minutes (60 + 15 buffer after)

### Group bookings

Set `max_participants > 1` to allow multiple customers to book the same slot:

```json
{
  "name": "Group Yoga Class",
  "duration_minutes": 60,
  "max_participants": 12
}
```

### Requires confirmation

If `requires_confirmation: true`, bookings start in `pending` status and the provider must manually confirm them via `POST /obp/v1/bookings/:id/confirm`.

### Cancellation policy

```json
"cancellation_policy": {
  "deadline_hours": 24,
  "fee_percent": 50
}
```

This means: cancellations less than 24 hours before the appointment incur a 50% cancellation fee.
