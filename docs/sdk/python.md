# Python SDK

`obp-client` is a zero-dependency Python SDK for the OpenBooking Protocol. Requires Python 3.10+.

## Installation

```bash
pip install obp-client
```

## Quick start

```python
from obp_client import OBPClient

client = OBPClient(
    base_url="https://obp.example.com",
    api_key="obpk_...",  # optional, for provider endpoints
)

# List services
services = client.services.list(category="beauty")
print(services.data[0].name)  # "Women's Haircut"

# Get available slots
slots = client.slots.list(
    service_id="svc_xyz789",
    from_date="2026-04-15",
    to_date="2026-04-22",
)

# Hold a slot
hold = client.slots.hold(
    slot_id=slots.data[0].id,
    customer_email="ana@example.com",
)

# Create a booking
booking = client.bookings.create(
    hold_id=hold.hold_id,
    service_id="svc_xyz789",
    customer_name="Ana Petrović",
    customer_email="ana@example.com",
    customer_phone="+381641234567",
    notes="First visit",
)

print(booking.id)      # "bkg_def456"
print(booking.status)  # "confirmed"
```

## Configuration

```python
client = OBPClient(
    base_url="https://obp.example.com",  # required
    api_key="obpk_...",                  # optional
    bearer_token="eyJ...",              # optional, for OAuth2 flows
    timeout=30,                          # request timeout in seconds (default: 30)
    max_retries=3,                       # retry on 5xx/429 (default: 3)
)
```

## Providers

```python
# List providers
providers = client.providers.list(category="beauty", city="Belgrade")

# Get a provider
provider = client.providers.get("prv_abc123")
print(provider.name)         # "Salon Ivana"
print(provider.location.city) # "Belgrade"

# Create a provider (requires admin API key)
new_provider = client.providers.create(
    name="Salon Ivana",
    category="beauty",
    location={
        "address": "Knez Mihailova 10",
        "city": "Belgrade",
        "country": "RS",
    },
    timezone="Europe/Belgrade",
    contact={"email": "ivana@salon.rs"},
)
```

## Services

```python
# List services
services = client.services.list(provider_id="prv_abc123")

# Get a service
service = client.services.get("svc_xyz789")
print(service.duration_minutes)  # 60
print(service.price.amount)      # 250000

# Create a service (requires write API key)
new_service = client.services.create(
    name="Women's Haircut",
    duration_minutes=60,
    buffer_after_minutes=15,
    price={"amount": 250000, "currency": "RSD"},
    max_participants=1,
    requires_confirmation=False,
    cancellation_policy={"deadline_hours": 24, "fee_percent": 50},
)

# Update a service
updated = client.services.update("svc_xyz789", active=False)

# Delete (deactivate)
client.services.delete("svc_xyz789")
```

## Slots

```python
# List available slots
slots = client.slots.list(
    service_id="svc_xyz789",
    from_date="2026-04-15",
    to_date="2026-04-22",
    timezone="Europe/Belgrade",
)

for slot in slots.data:
    if slot.available:
        print(f"{slot.starts_at} — capacity: {slot.remaining_capacity}")

# Hold a slot
hold = client.slots.hold(
    slot_id="slot_20260415T100000_svc_xyz789",
    customer_email="ana@example.com",
)
print(hold.hold_id)      # "hold_abc123"
print(hold.ttl_seconds)  # 600
```

## Bookings

```python
# Create a booking
booking = client.bookings.create(
    hold_id="hold_abc123",
    service_id="svc_xyz789",
    customer_name="Ana Petrović",
    customer_email="ana@example.com",
)

# Get a booking (no auth required)
booking = client.bookings.get("bkg_def456")
print(booking.status)    # "confirmed"
print(booking.starts_at) # datetime object

# Cancel a booking
client.bookings.cancel("bkg_def456", reason="Change of plans")

# Provider: list all bookings
bookings = client.bookings.list(
    status="confirmed",
    from_date="2026-04-01",
    to_date="2026-04-30",
)

# Provider actions
client.bookings.confirm("bkg_def456")
client.bookings.complete("bkg_def456")
client.bookings.no_show("bkg_def456")
```

## Server discovery

```python
info = client.discover()
print(info.obp_version)        # "1.0.0"
print(info.federation_enabled) # True
print(info.server_name)        # "Example Booking Platform"
```

## Error handling

```python
from obp_client import OBPClient, OBPError, NetworkError, TimeoutError

try:
    booking = client.bookings.get("bkg_nonexistent")
except OBPError as e:
    print(e.status)     # 404
    print(e.title)      # "Not Found"
    print(e.detail)     # "Booking bkg_nonexistent not found"
    if e.is_not_found():
        print("Booking doesn't exist")
    if e.is_conflict():
        print("Slot was taken")
    if e.is_rate_limited():
        print("Slow down, retry later")
except NetworkError as e:
    print(f"Network failure: {e}")
except TimeoutError as e:
    print(f"Request timed out: {e}")
```

## Data types

All API responses are returned as Python dataclasses:

```python
from obp_client.types import (
    Provider,
    Service,
    Slot,
    SlotHold,
    Booking,
    PaginatedResponse,
    WellKnownObp,
)

# PaginatedResponse is generic
services: PaginatedResponse[Service] = client.services.list()
service: Service = services.data[0]

# Access nested objects
print(service.price.amount)    # int (minor units)
print(service.price.currency)  # "RSD"
```

## Using as a context manager

```python
# The client is also usable as a context manager (future async version)
with OBPClient(base_url="https://obp.example.com") as client:
    providers = client.providers.list()
```

## Changelog

### 0.1.0

- Initial release
- Full coverage of core OBP endpoints
- Zero runtime dependencies (stdlib `urllib` only)
- Python 3.10+ dataclass-based response types
- Retry with exponential backoff on `408`, `429`, `500`, `502`, `503`, `504`
- RFC 7807 Problem Details error parsing
