# OBP Entities — Specification

**Version:** 1.0.0-draft

This document describes all core OBP entities: their fields, validation rules, relationships, and behavioral semantics. For the machine-readable schema, see `components/schemas/`.

---

## 1. Provider

A **Provider** is a business or individual offering bookable services on an OBP server.

### 1.1 Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | string | yes | Prefix `prv_`, server-assigned, immutable |
| `name` | string | yes | 1–100 chars |
| `slug` | string | yes | 2–60 chars, `[a-z0-9-]+`, unique per server |
| `description` | string | no | max 2000 chars |
| `logo_url` | URI | no | HTTPS in production |
| `website` | URI | no | HTTPS in production |
| `email` | email | no | Unique per server; used as login identity |
| `phone` | string | no | Pattern: `^\+?[0-9\s\-().]{7,20}$` |
| `address` | Address | no | See Address object |
| `category` | enum | yes | See ProviderCategory enum |
| `timezone` | string | yes | Valid IANA timezone identifier |
| `status` | enum | yes | `active`, `inactive`, `suspended` |

### 1.2 Validation rules

- `slug` must be unique on the server
- `timezone` must be a valid IANA identifier (validated against tzdata)
- Status `suspended` may only be set by server admin, not by the provider
- Changing `slug` is not supported after creation (it is part of the provider's identity)

### 1.3 Status transitions

```
active ←→ inactive   (by provider)
active → suspended   (by admin only)
suspended → active   (by admin only)
```

---

## 2. Service

A **Service** is a specific bookable offering of a Provider.

### 2.1 Fields

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `id` | string | yes | — | Prefix `svc_` |
| `provider_id` | string | yes | — | Must reference existing provider |
| `name` | string | yes | — | 1–100 chars |
| `description` | string | no | null | max 1000 chars |
| `category` | enum | yes | — | See ServiceCategory enum |
| `duration_minutes` | integer | yes | — | 5–480, multiple of 5 |
| `buffer_minutes` | integer | no | 0 | 0–120 |
| `price` | Money | no | null | amount ≥ 0, ISO 4217 currency |
| `max_advance_days` | integer | no | 90 | 1–365 |
| `min_advance_hours` | integer | no | 0 | 0–168 |
| `max_per_day` | integer | no | null | ≥ 1; null = unlimited |
| `resource_ids` | string[] | no | [] | All IDs must belong to this provider |
| `status` | enum | no | active | `active`, `inactive` |
| `sort_order` | integer | no | 0 | Used for display ordering |

### 2.2 Validation rules

- `duration_minutes` MUST be a multiple of 5
- `buffer_minutes + duration_minutes` MUST NOT exceed 480
- All `resource_ids` MUST belong to the same `provider_id`
- `max_advance_days` MUST be ≥ `ceil(min_advance_hours / 24)`
- Deactivating a service does NOT cancel existing bookings

### 2.3 Service categories

See `ServiceCategory` enum in `components/schemas/Service.yaml` — 46 categories covering hair, beauty, health, fitness, sports, coworking, education, and more.

---

## 3. Resource

A **Resource** is a physical or virtual entity required to deliver a Service (staff member, room, equipment).

### 3.1 Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | string | yes | Prefix `res_` |
| `provider_id` | string | yes | Parent provider |
| `name` | string | yes | 1–100 chars |
| `description` | string | no | max 500 chars |
| `type` | enum | yes | `staff`, `room`, `equipment` |
| `avatar_url` | URI | no | For staff photos |
| `status` | enum | yes | `active`, `inactive` |

### 3.2 Resource–Service binding

- A Service lists `resource_ids` of all Resources it requires
- A Slot is generated ONLY when ALL listed Resources are simultaneously available
- One Resource can serve multiple Services
- Deactivating a Resource prevents new slot generation but does NOT cancel bookings

### 3.3 Availability check

A Resource is unavailable at a given time if:
1. It appears in a non-cancelled Booking whose time range overlaps the candidate slot, OR
2. Its Schedule marks it as unavailable (closed day or outside working hours)

---

## 4. Schedule

A **Schedule** defines when a Provider or Resource is available.

### 4.1 Scope

- **Provider-level** (`resource_id: null`): applies when a Service has no `resource_ids`
- **Resource-level** (`resource_id: <id>`): applies to that specific Resource; overrides provider schedule for that resource

### 4.2 Recurring rules

Each rule defines availability for one day of the week:

```yaml
day_of_week: mon   # mon|tue|wed|thu|fri|sat|sun
start_time: "09:00"  # HH:MM, wall-clock in schedule timezone
end_time: "18:00"
```

Constraints:
- Each `day_of_week` MAY appear at most once (no split shifts in v1)
- `end_time` MUST be strictly after `start_time`

### 4.3 Exceptions

Exceptions override recurring rules for a specific date:

```yaml
date: "2026-12-31"
type: custom_hours   # closed | custom_hours
start_time: "09:00"  # required when type=custom_hours
end_time: "13:00"
note: "New Year's Eve — short day"
```

Exception priority: exceptions take precedence over recurring rules.

### 4.4 Slot generation algorithm

For each day in the requested date range:

1. Check for a ScheduleException on that date → apply if found
2. Otherwise, find the RecurringRule for that `day_of_week`
3. If no rule, the day is unavailable → skip
4. Within the available window `[start_time, end_time)`, generate slots:
   - Step: `service.duration_minutes + service.buffer_minutes`
   - First slot: starts at `start_time`
   - Last slot: must end at or before `end_time`
5. Exclude slots where any required Resource has a conflicting booking

### 4.5 Timezone handling

- All Schedule times are wall-clock in the Schedule's `timezone`
- Slots are stored and returned as UTC
- DST gaps: slots that would start in a DST gap are skipped
- DST folds: slots in a fold are generated once (using the pre-fold offset)
- A Provider MUST have exactly one provider-level schedule

---

## 5. Slot

A **Slot** is a computed available time window for a Service.

### 5.1 Generation

Slots are NOT pre-persisted. They are computed dynamically on `GET /slots` from the Schedule and existing bookings. This ensures consistency without requiring a background generation job.

### 5.2 ID scheme

Slot IDs are deterministic:

```
slt_{base62(sha256(service_id + ":" + start_at_utc)[:8])}
```

This allows clients to reference slots by ID without prior listing.

### 5.3 Hold mechanism

A hold is a Redis key `hold:{slot_id}` with configurable TTL (default: 10 min).

- Created atomically via `SET NX EX` (one writer wins; others get 409)
- A session can hold at most one slot per service simultaneously
- Hold expiry releases the slot back to `available` automatically
- Booking creation releases the hold on success

### 5.4 Conflict resolution

A slot is unavailable if ANY of:
1. A ScheduleException marks the date as `closed`
2. The slot falls outside the RecurringRule window
3. The slot falls in a DST gap
4. An active Redis hold exists for this slot
5. A non-cancelled Booking overlaps any required Resource's time

Conflict check uses half-open intervals: `[start_at, end_at)`. Two slots overlap if:
```
A.start_at < B.end_at AND A.end_at > B.start_at
```

---

## 6. Booking

A **Booking** is a confirmed reservation of a Slot by a Customer.

### 6.1 Lifecycle (state machine)

```
                    ┌──────────┐
             ┌─────►│ pending  ├──────────────┐
             │      └────┬─────┘              │
        [created]        │ [confirm]          │ [cancel]
             │           ▼                    ▼
             │      ┌──────────┐       ┌───────────┐
             │      │confirmed │──────►│ cancelled │
             │      └────┬─────┘       └───────────┘
             │           │
             │    ┌──────┴───────┐
             │    │              │
             │  [complete]    [no-show]
             │    │              │
             │    ▼              ▼
             │ ┌──────────┐ ┌─────────┐
             │ │completed │ │no_show  │
             │ └──────────┘ └─────────┘
             └─────────────────────────
```

### 6.2 Valid transitions

| From | To | Actor | Condition |
|------|----|-------|-----------|
| — | pending | anyone | slot available |
| pending | confirmed | provider | — |
| pending | cancelled | customer or provider | — |
| confirmed | completed | provider | — |
| confirmed | cancelled | customer or provider | within cancellation window |
| confirmed | no_show | provider | only after `slot.start_at` has passed |

Invalid transitions return HTTP 409.

### 6.3 Double-booking prevention

Booking creation uses:
1. Slot hold check (Redis): if no hold or expired, proceed
2. `SELECT ... FOR UPDATE` on resource rows overlapping the time range
3. Optimistic locking: `version` field is checked and incremented atomically

If the slot was booked between the hold and creation → 409.

### 6.4 Federated bookings

- `federated_from`: base URL of the originating OBP server
- `federated_booking_id`: booking ID on the originating server
- Customer data is minimal (name, email, optional phone)
- The originating server is responsible for customer communication

---

## 7. Entity relationships

```
Server
  └── Provider (many per server)
        ├── Service (many per provider)
        │     └── resource_ids → [Resource, ...]
        ├── Resource (many per provider)
        │     └── Schedule (one per resource, optional)
        ├── Schedule (one provider-level)
        └── Booking (many per provider)
              ├── service_id → Service
              └── slot_id → Slot (computed)
```
