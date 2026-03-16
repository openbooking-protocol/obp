# @obp/client

Official JavaScript/TypeScript client for the [OpenBooking Protocol](https://github.com/openbooking-protocol/obp).

## Installation

```bash
npm install @obp/client
```

## Quick start

```typescript
import { OBPClient } from '@obp/client';

const client = new OBPClient({
  baseUrl: 'https://obp.example.com',
  apiKey: process.env.OBP_API_KEY, // optional, for provider endpoints
});

// Discover server capabilities
const server = await client.discover();

// List available services
const { data: services } = await client.services.list({ category: 'beauty' });

// Check availability
const { data: slots } = await client.slots.list({
  service_id: services[0].id,
  date_from: '2026-04-01',
  date_to: '2026-04-01',
});

// Hold a slot (10-minute reservation)
const hold = await client.slots.hold(slots[0].id);

// Create a booking
const booking = await client.bookings.create({
  slot_id: slots[0].id,
  hold_token: hold.hold_token,
  customer: {
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '+381601234567',
  },
  notes: 'First visit',
});

console.log('Booking created:', booking.id);

// Add to calendar
const icsUrl = client.bookingCalendarUrl(booking.id);
```

## Configuration

```typescript
const client = new OBPClient({
  baseUrl: 'https://obp.example.com', // Required
  apiKey: 'obpk_...',                 // For provider management endpoints
  token: 'eyJ...',                    // For OAuth2 user endpoints
  timeout: 30_000,                    // Request timeout in ms (default: 30000)
  maxRetries: 3,                      // Max retry attempts (default: 3)
  fetch: customFetch,                 // Custom fetch implementation
});
```

## Error handling

```typescript
import { OBPClient, OBPError, NetworkError } from '@obp/client';

try {
  const booking = await client.bookings.create({ ... });
} catch (err) {
  if (err instanceof OBPError) {
    console.error(`API error ${err.status}: ${err.title}`);
    if (err.isConflict()) {
      console.error('Slot was taken by another customer');
    }
    if (err.isRateLimited()) {
      console.error('Rate limited — slow down');
    }
  } else if (err instanceof NetworkError) {
    console.error('Network error:', err.message);
  }
}
```

## Provider management

```typescript
const client = new OBPClient({
  baseUrl: 'https://obp.example.com',
  apiKey: process.env.OBP_API_KEY,
});

// List bookings for your provider
const { data: bookings } = await client.bookings.list({
  status: 'pending',
  date_from: '2026-04-01',
});

// Confirm a booking
await client.bookings.confirm(bookings[0].id);

// Create a service
const service = await client.services.create({
  provider_id: 'prv_...',
  name: 'Haircut',
  description: 'Standard haircut service',
  duration_minutes: 45,
  price: { amount: 2500, currency: 'RSD' }, // amount in cents
  max_participants: 1,
  requires_confirmation: false,
  buffer_after_minutes: 15,
  tags: ['hair'],
  active: true,
});
```

## API Reference

| Resource | Methods |
|---|---|
| `client.providers` | `list()`, `get(id)`, `create()`, `update()`, `categories()` |
| `client.services` | `list()`, `get(id)`, `create()`, `update()`, `delete()` |
| `client.slots` | `list()`, `get(id)`, `hold(id)` |
| `client.bookings` | `list()`, `get(id)`, `create()`, `confirm()`, `cancel()`, `complete()`, `noShow()` |

## License

MIT
