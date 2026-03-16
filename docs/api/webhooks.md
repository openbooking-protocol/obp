# Webhooks API

Webhooks allow your application to receive real-time notifications when booking events occur.

## POST /obp/v1/webhooks

Create a webhook subscription.

**Authentication:** `X-Api-Key` with `write` scope

### Request body

```json
{
  "url": "https://yourapp.com/webhooks/obp",
  "events": ["booking.created", "booking.cancelled"],
  "secret": "your-webhook-secret"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | Yes | HTTPS URL to deliver events to |
| `events` | string[] | Yes | Events to subscribe to (see below) |
| `secret` | string | No | Secret for signature verification (recommended) |

### Available events

| Event | Triggered when |
|---|---|
| `booking.created` | A new booking is created |
| `booking.confirmed` | A pending booking is confirmed |
| `booking.cancelled` | A booking is cancelled |
| `booking.completed` | A booking is marked complete |
| `booking.no_show` | A booking is marked no-show |
| `service.created` | A new service is created |
| `service.updated` | A service is updated |
| `service.deleted` | A service is deactivated |

### Response `201 Created`

```json
{
  "id": "wh_jkl012",
  "url": "https://yourapp.com/webhooks/obp",
  "events": ["booking.created", "booking.cancelled"],
  "provider_id": "prv_abc123",
  "active": true,
  "created_at": "2026-03-16T10:00:00Z"
}
```

---

## GET /obp/v1/webhooks

List all webhooks for the authenticated provider.

**Authentication:** `X-Api-Key` with `read` scope

---

## DELETE /obp/v1/webhooks/:id

Delete a webhook subscription.

**Authentication:** `X-Api-Key` with `write` scope

### Response `204 No Content`

---

## Webhook payload

All webhook events share the same envelope structure:

```json
{
  "id": "evt_mno345",
  "event": "booking.created",
  "created_at": "2026-04-15T09:05:00Z",
  "data": {
    "booking": {
      "id": "bkg_def456",
      "status": "confirmed",
      "..."
    }
  }
}
```

---

## Signature verification

When a `secret` is provided, OBP signs webhook payloads using HMAC-SHA256:

```http
POST /webhooks/obp HTTP/1.1
X-OBP-Signature: sha256=abc123...
X-OBP-Event: booking.created
X-OBP-Delivery: evt_mno345
```

Verify in Node.js:

```javascript
import crypto from 'node:crypto';

function verifyWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your handler:
app.post('/webhooks/obp', (req, res) => {
  const sig = req.headers['x-obp-signature'];
  const raw = JSON.stringify(req.body);
  if (!verifyWebhook(raw, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  // Process event...
  res.status(200).send('ok');
});
```

---

## Delivery and retries

- Webhook requests must be acknowledged within **5 seconds** with a 2xx response
- Failed deliveries are retried up to **3 times** with exponential backoff (1 min, 5 min, 30 min)
- After all retries fail, the webhook is marked as failed and the event is logged
- Webhooks that consistently fail (>10 consecutive failures) are automatically disabled

## GET /obp/v1/webhooks/:id/deliveries

View recent delivery attempts.

**Authentication:** `X-Api-Key` with `read` scope

```json
{
  "data": [
    {
      "id": "del_pqr678",
      "event_id": "evt_mno345",
      "event": "booking.created",
      "status": "success",
      "response_code": 200,
      "duration_ms": 124,
      "delivered_at": "2026-04-15T09:05:01Z"
    },
    {
      "id": "del_stu901",
      "event_id": "evt_vwx234",
      "event": "booking.cancelled",
      "status": "failed",
      "response_code": 500,
      "error": "Connection refused",
      "attempts": 3,
      "last_attempted_at": "2026-04-15T10:30:00Z"
    }
  ]
}
```
