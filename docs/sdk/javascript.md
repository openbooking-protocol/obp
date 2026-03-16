# JavaScript / TypeScript SDK

> **Status:** Coming in Phase 4. The SDK will be generated from the OpenAPI specification.

## Installation

```bash
npm install @obp/client
```

## Basic usage

```typescript
import { OBPClient } from '@obp/client';

const client = new OBPClient({
  baseUrl: 'https://obp.example.com',
  apiKey: process.env.OBP_API_KEY, // optional, for provider endpoints
});

// List services
const services = await client.services.list({ category: 'hair' });

// Check availability
const slots = await client.slots.list({
  serviceId: services.data[0].id,
  date: '2026-04-01',
});

// Create a booking
const booking = await client.bookings.create({
  slotId: slots.data[0].id,
  customer: {
    name: 'Marko Markovic',
    email: 'marko@example.com',
    phone: '+381601234567',
  },
});
```

## TypeScript types

All types are generated from the OpenAPI specification and exported from the package:

```typescript
import type { Booking, Service, Slot, Provider } from '@obp/client';
```
