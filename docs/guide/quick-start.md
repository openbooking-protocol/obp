# Quick Start

Make your first booking in 5 minutes. Assumes the server is running locally (see [Getting Started](/guide/getting-started)).

## 1. Discover the server

```bash
curl http://localhost:3000/.well-known/obp
```

## 2. List available services

```bash
curl http://localhost:3000/obp/v1/services
```

## 3. Check availability

```bash
curl "http://localhost:3000/obp/v1/slots?service_id=<id>&date=2026-04-01"
```

## 4. Hold a slot

```bash
curl -X POST http://localhost:3000/obp/v1/slots/<slot_id>/hold \
  -H "Content-Type: application/json"
```

The hold lasts 10 minutes (configurable via Redis TTL).

## 5. Create a booking

```bash
curl -X POST http://localhost:3000/obp/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "slot_id": "<slot_id>",
    "customer": {
      "name": "Marko Markovic",
      "email": "marko@example.com"
    }
  }'
```

## 6. Confirm the booking

```bash
curl -X POST http://localhost:3000/obp/v1/bookings/<booking_id>/confirm \
  -H "Authorization: Bearer <token>"
```

Your booking is confirmed. The provider receives a webhook notification (if configured).

## Using the JavaScript SDK

```typescript
import { OBPClient } from '@obp/client';

const client = new OBPClient({ baseUrl: 'http://localhost:3000' });

const slots = await client.slots.list({ serviceId: 'svc_123', date: '2026-04-01' });
const hold = await client.slots.hold(slots[0].id);
const booking = await client.bookings.create({
  slotId: slots[0].id,
  customer: { name: 'Marko Markovic', email: 'marko@example.com' },
});
```
