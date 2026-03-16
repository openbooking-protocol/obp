# OBP Extensions — Specification

**Version:** 1.0.0-draft

This document defines how OBP can be extended without breaking core protocol compatibility.

---

## 1. Extension philosophy

OBP follows the principle of **conservative sending, liberal accepting**: servers should only send fields defined in the spec, but should ignore unknown fields in received data.

Extensions MUST NOT:
- Change the meaning of existing fields
- Make previously optional fields required
- Remove existing endpoints
- Change error format

Extensions MAY:
- Add new optional fields to existing schemas
- Add new endpoints under `/obp/v1/`
- Add new webhook event types
- Add new capability flags to `/.well-known/obp`

---

## 2. Capability advertisement

Servers advertise supported extensions in the discovery document:

```json
{
  "capabilities": {
    "federation": true,
    "webhooks": true,
    "ical_export": true,
    "oauth2": true,
    "extensions": {
      "obp-pay": "1.0",
      "obp-groups": "0.1"
    }
  }
}
```

Clients check the `extensions` map before using extension features.

---

## 3. Planned official extensions

### 3.1 `obp-pay` — Payment integration

Adds a payment step to the booking flow.

**New fields on Service:**
- `payment_required: boolean`
- `payment_provider: "stripe" | "paypal" | "custom"`

**New endpoint:**
- `POST /obp/v1/bookings/{id}/pay` — initiate payment
- `GET /obp/v1/bookings/{id}/payment-status`

**New booking statuses:**
- `payment_pending` (between `pending` and `confirmed`)
- `payment_failed`

**Capability flag:** `"obp-pay": "1.0"`

---

### 3.2 `obp-groups` — Group bookings

Multiple participants per slot (e.g., yoga classes, group tours).

**New fields on Service:**
- `max_participants: integer` (default 1)

**New fields on Slot:**
- `remaining_capacity: integer`
- `total_capacity: integer`

**New fields on Booking:**
- `participant_count: integer`

**Behavior changes:**
- A slot transitions to `booked` only when `remaining_capacity == 0`
- Multiple bookings can exist for the same slot

**Capability flag:** `"obp-groups": "1.0"`

---

### 3.3 `obp-recurring` — Recurring bookings

Book the same slot weekly/monthly (e.g., weekly personal training session).

**New fields on BookingCreate:**
- `recurrence: { frequency: "weekly" | "biweekly" | "monthly", end_date: date, count: integer }`

**Response:**
- `recurrence_id: string` — groups all instances
- `GET /obp/v1/recurrences/{id}` — list all instances

**Capability flag:** `"obp-recurring": "1.0"`

---

### 3.4 `obp-waitlist` — Waitlist

Customers join a waitlist when a slot is fully booked. Automatically offered the slot if it becomes available.

**New endpoint:**
- `POST /obp/v1/slots/{id}/waitlist` — join waitlist
- `DELETE /obp/v1/slots/{id}/waitlist` — leave waitlist

**New webhook event:**
- `slot.waitlist_offer` — slot available, customer offered booking window

**Capability flag:** `"obp-waitlist": "1.0"`

---

### 3.5 `obp-reviews` — Customer reviews

Post-booking customer ratings and reviews.

**New endpoint:**
- `POST /obp/v1/bookings/{id}/review`
- `GET /obp/v1/providers/{id}/reviews`

**New fields on Provider:**
- `rating_average: number | null`
- `rating_count: integer`

**Capability flag:** `"obp-reviews": "1.0"`

---

## 4. Custom extensions

Third-party extensions SHOULD use a namespaced capability key:

```
"extensions": {
  "com.mycompany.custom-feature": "1.0"
}
```

Custom extension endpoints SHOULD use a vendor prefix:
```
POST /obp/v1/x-mycompany/custom-endpoint
```

This prevents namespace conflicts with future official extensions.

---

## 5. Versioning

Extension versions follow [Semantic Versioning](https://semver.org/):
- MAJOR: breaking changes (new required fields, removed fields)
- MINOR: backward-compatible additions
- PATCH: bug fixes to spec wording

A server advertising `"obp-pay": "1.2"` MUST support all features of `obp-pay` 1.x.

---

## 6. Extension registry

Extensions seeking official status should be proposed via GitHub Discussions under the `RFC` label at `https://github.com/openbooking-protocol/obp/discussions`.

An RFC should include:
1. Problem statement and use cases
2. Proposed schema changes (OpenAPI YAML)
3. Migration path for existing implementations
4. Reference implementation
