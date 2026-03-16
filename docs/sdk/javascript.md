# JavaScript / TypeScript SDK

`@obp/client` is a zero-dependency TypeScript SDK for the OpenBooking Protocol. Works in Node.js 18+, Deno, and modern browsers.

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

// List services
const services = await client.services.list({ category: 'beauty' });
console.log(services.data[0].name); // "Women's Haircut"

// Get available slots
const slots = await client.slots.list({
  serviceId: 'svc_xyz789',
  from: '2026-04-15',
  to: '2026-04-22',
});

// Hold a slot
const hold = await client.slots.hold('slot_20260415T100000_svc_xyz789', {
  customerEmail: 'ana@example.com',
});

// Create a booking
const booking = await client.bookings.create({
  holdId: hold.holdId,
  serviceId: 'svc_xyz789',
  customer: {
    name: 'Ana Petrović',
    email: 'ana@example.com',
    phone: '+381641234567',
  },
  notes: 'First visit',
});

console.log(booking.id); // "bkg_def456"
console.log(booking.status); // "confirmed"
```

## Configuration

```typescript
const client = new OBPClient({
  baseUrl: 'https://obp.example.com', // required
  apiKey: 'obpk_...',                  // optional, for authenticated endpoints
  bearerToken: 'eyJ...',              // optional, for OAuth2 flows
  timeout: 30_000,                    // request timeout in ms (default: 30s)
  maxRetries: 3,                      // retry on 5xx/429 (default: 3)
  fetch: customFetchFunction,         // custom fetch implementation
});
```

## Providers

```typescript
// List providers
const providers = await client.providers.list({
  category: 'beauty',
  city: 'Belgrade',
  page: 1,
  perPage: 20,
});

// Get a provider
const provider = await client.providers.get('prv_abc123');

// Create a provider (requires admin API key)
const newProvider = await client.providers.create({
  name: 'Salon Ivana',
  category: 'beauty',
  location: {
    address: 'Knez Mihailova 10',
    city: 'Belgrade',
    country: 'RS',
  },
  timezone: 'Europe/Belgrade',
  contact: { email: 'ivana@salon.rs' },
});
```

## Services

```typescript
// List services
const services = await client.services.list({ providerId: 'prv_abc123' });

// Get a service
const service = await client.services.get('svc_xyz789');

// Create a service (requires write API key)
const newService = await client.services.create({
  name: "Women's Haircut",
  durationMinutes: 60,
  bufferAfterMinutes: 15,
  price: { amount: 250000, currency: 'RSD' },
  maxParticipants: 1,
  requiresConfirmation: false,
  cancellationPolicy: { deadlineHours: 24, feePercent: 50 },
});

// Update a service
const updated = await client.services.update('svc_xyz789', { active: false });

// Delete (deactivate) a service
await client.services.delete('svc_xyz789');
```

## Slots

```typescript
// List available slots
const slots = await client.slots.list({
  serviceId: 'svc_xyz789',
  from: '2026-04-15',
  to: '2026-04-22',
  timezone: 'Europe/Belgrade',
});

// Hold a slot (before booking)
const hold = await client.slots.hold('slot_20260415T100000_svc_xyz789', {
  customerEmail: 'ana@example.com',
});
// hold.holdId, hold.expiresAt, hold.ttlSeconds

// Release a hold
await client.slots.releaseHold('slot_20260415T100000_svc_xyz789', hold.holdId);
```

## Bookings

```typescript
// Create a booking
const booking = await client.bookings.create({
  holdId: 'hold_abc123',
  serviceId: 'svc_xyz789',
  customer: {
    name: 'Ana Petrović',
    email: 'ana@example.com',
  },
});

// Get a booking (no auth required)
const booking = await client.bookings.get('bkg_def456');

// Cancel a booking
await client.bookings.cancel('bkg_def456', { reason: 'Change of plans' });

// Provider: list all bookings
const bookings = await client.bookings.list({
  status: 'confirmed',
  from: '2026-04-01',
  to: '2026-04-30',
});

// Provider: confirm a pending booking
await client.bookings.confirm('bkg_def456');

// Provider: mark complete
await client.bookings.complete('bkg_def456');

// Provider: mark no-show
await client.bookings.noShow('bkg_def456');
```

## Server discovery

```typescript
// Discover server metadata
const info = await client.discover();
console.log(info.obpVersion);        // "1.0.0"
console.log(info.federationEnabled); // true
```

## Calendar URLs

```typescript
// iCal URL for a specific booking
const icalUrl = client.bookingCalendarUrl('bkg_def456');
// "https://obp.example.com/obp/v1/bookings/bkg_def456/ical"

// iCal feed for all provider bookings
const feedUrl = client.providerCalendarUrl('prv_abc123');
// "https://obp.example.com/obp/v1/providers/prv_abc123/calendar.ics"
```

## Error handling

```typescript
import { OBPClient, OBPError, NetworkError, TimeoutError } from '@obp/client';

try {
  const booking = await client.bookings.get('bkg_nonexistent');
} catch (err) {
  if (err instanceof OBPError) {
    console.log(err.status);     // 404
    console.log(err.title);      // "Not Found"
    console.log(err.detail);     // "Booking bkg_nonexistent not found"
    console.log(err.isNotFound()); // true

    if (err.isConflict()) { /* slot taken */ }
    if (err.isRateLimited()) { /* retry later */ }
    if (err.isUnauthorized()) { /* check API key */ }
  } else if (err instanceof NetworkError) {
    // DNS failure, connection refused
  } else if (err instanceof TimeoutError) {
    // Request took too long
  }
}
```

## Dynamic configuration

Create a new client with modified settings without mutating the original:

```typescript
const adminClient = client.withConfig({ apiKey: 'obpk_admin_key' });
const timeoutClient = client.withConfig({ timeout: 5_000 });
```

## TypeScript types

All types are exported from `@obp/client`:

```typescript
import type {
  Provider,
  Service,
  Slot,
  SlotHold,
  Booking,
  PaginatedResponse,
  WellKnownObp,
  OBPClientConfig,
} from '@obp/client';
```

## Changelog

### 0.1.0

- Initial release
- Full coverage of core OBP endpoints
- Zero runtime dependencies
- ESM + CJS dual output
- Retry with exponential backoff
- TypeScript types for all resources
