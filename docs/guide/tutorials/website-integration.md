# Tutorial: Website Integration

This tutorial shows how to embed OBP booking into an existing website — for example, a business that already has a WordPress, Webflow, or custom HTML site.

## Options

| Approach | Best for | Effort |
|---|---|---|
| JavaScript widget (embed) | Any website, no coding | Low |
| `@obp/client` (custom UI) | React/Next.js/Vue apps | Medium |
| Direct API calls | Any backend | Medium |
| iFrame embed | Legacy sites, sandboxed | Low |

## Option 1: JavaScript widget embed

The fastest way — drop a script tag into any HTML page:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Book an appointment</title>
</head>
<body>
  <h1>Salon Ivana — Book Online</h1>

  <!-- OBP Booking Widget -->
  <div id="obp-booking"></div>

  <script src="https://cdn.jsdelivr.net/npm/@obp/widget@latest/dist/widget.min.js"></script>
  <script>
    OBPWidget.init('#obp-booking', {
      server: 'https://obp.yourdomain.com',
      providerId: 'prv_abc123',
      locale: 'en',          // or 'sr' for Serbian
      theme: 'light',        // 'light' | 'dark' | 'auto'
      primaryColor: '#6366f1',
      onBookingComplete: function(booking) {
        console.log('Booking created:', booking.id);
        // Optional: track conversion
        gtag('event', 'booking_complete', { booking_id: booking.id });
      }
    });
  </script>
</body>
</html>
```

### Widget configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `server` | string | required | OBP server URL |
| `providerId` | string | required | Provider to show services for |
| `serviceId` | string | — | Pre-select a specific service |
| `locale` | string | `en` | UI language |
| `theme` | string | `auto` | `light`, `dark`, or `auto` (follows system) |
| `primaryColor` | string | `#6366f1` | Brand color (hex) |
| `onBookingComplete` | function | — | Callback after successful booking |
| `onError` | function | — | Callback on error |

## Option 2: React integration with @obp/client

For custom booking UIs in React or Next.js:

```bash
npm install @obp/client
```

```tsx
// components/BookingSection.tsx
'use client';
import { useState, useEffect } from 'react';
import { OBPClient } from '@obp/client';
import type { Service, Slot, SlotHold } from '@obp/client';

const client = new OBPClient({ baseUrl: 'https://obp.yourdomain.com' });

export function BookingSection({ providerId }: { providerId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [hold, setHold] = useState<SlotHold | null>(null);
  const [step, setStep] = useState<'service' | 'slot' | 'form' | 'success'>('service');

  useEffect(() => {
    client.services.list({ providerId }).then(res => setServices(res.data));
  }, [providerId]);

  async function selectService(service: Service) {
    setSelectedService(service);
    const today = new Date().toISOString().split('T')[0]!;
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]!;
    const res = await client.slots.list({
      serviceId: service.id,
      from: today,
      to: nextWeek,
    });
    setSlots(res.data.filter(s => s.available));
    setStep('slot');
  }

  async function selectSlot(slot: Slot) {
    const h = await client.slots.hold(slot.id);
    setHold(h);
    setStep('form');
  }

  async function submitBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await client.bookings.create({
      holdId: hold!.holdId,
      serviceId: selectedService!.id,
      customer: {
        name: form.get('name') as string,
        email: form.get('email') as string,
        phone: form.get('phone') as string,
      },
    });
    setStep('success');
  }

  if (step === 'service') return (
    <div>
      <h2>Select a service</h2>
      {services.map(s => (
        <button key={s.id} onClick={() => selectService(s)}>
          {s.name} — {s.durationMinutes} min
        </button>
      ))}
    </div>
  );

  if (step === 'slot') return (
    <div>
      <h2>Choose a time</h2>
      {slots.map(slot => (
        <button key={slot.id} onClick={() => selectSlot(slot)}>
          {new Date(slot.startsAt).toLocaleString()}
        </button>
      ))}
    </div>
  );

  if (step === 'form') return (
    <form onSubmit={submitBooking}>
      <h2>Your details</h2>
      <input name="name" placeholder="Full name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="phone" placeholder="Phone" />
      <p>Hold expires in: {hold?.ttlSeconds}s</p>
      <button type="submit">Confirm booking</button>
    </form>
  );

  return <div><h2>Booking confirmed!</h2><p>Check your email for details.</p></div>;
}
```

## Option 3: WordPress plugin

Install the OBP WordPress plugin (search "OpenBooking Protocol" in the WordPress plugin directory) and add the shortcode to any page:

```
[obp_booking server="https://obp.yourdomain.com" provider_id="prv_abc123"]
```

Or embed just one service:

```
[obp_booking server="https://obp.yourdomain.com" service_id="svc_xyz789"]
```

## Option 4: iFrame embed

For maximum isolation (the booking form runs on your OBP server):

```html
<iframe
  src="https://obp.yourdomain.com/book?provider=prv_abc123&locale=en"
  width="100%"
  height="600"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
  title="Book an appointment"
  loading="lazy"
></iframe>
```

The iFrame is served directly by the OBP server, including the full booking flow. No JavaScript integration needed.

## Tracking and analytics

Listen for the booking completion event to fire analytics:

```html
<script>
  window.addEventListener('message', function(event) {
    if (event.data.type === 'obp:booking_complete') {
      const booking = event.data.booking;

      // Google Analytics 4
      gtag('event', 'purchase', {
        transaction_id: booking.id,
        value: booking.price.amount / 100,
        currency: booking.price.currency,
      });

      // Facebook Pixel
      fbq('track', 'Schedule', { content_ids: [booking.serviceId] });
    }
  });
</script>
```

## Adding a "Book Now" button

Link directly to the booking page for a specific service:

```html
<a href="https://obp.yourdomain.com/book?service=svc_xyz789" target="_blank">
  Book Now
</a>
```

Or trigger the widget modal from a button:

```html
<button onclick="OBPWidget.open()">Book an appointment</button>
```

## CORS configuration

If making API calls from the browser (option 2), ensure your OBP server allows your domain:

```env
# server/.env
CORS_ORIGIN=https://yoursalonwebsite.com,https://www.yoursalonwebsite.com
```
