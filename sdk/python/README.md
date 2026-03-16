# obp-client

Official Python client for the [OpenBooking Protocol](https://github.com/openbooking-protocol/obp).

**Zero dependencies** — uses only Python stdlib (`urllib`).

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

# Discover server capabilities
server = client.discover()
print(f"Connected to {server.server_name} v{server.obp_version}")

# List available services
services = client.services.list(category="beauty")

# Check availability
slots = client.slots.list(
    service_id=services.data[0].id,
    date_from="2026-04-01",
    date_to="2026-04-01",
)

# Hold a slot (10-minute reservation)
hold = client.slots.hold(slots.data[0].id)

# Create a booking
booking = client.bookings.create(
    slot_id=slots.data[0].id,
    hold_token=hold.hold_token,
    customer={"name": "Alice Smith", "email": "alice@example.com", "phone": "+381601234567"},
    notes="First visit",
)

print(f"Booking created: {booking.id} — status: {booking.status}")
ics_url = client.booking_calendar_url(booking.id)
print(f"Add to calendar: {ics_url}")
```

## Error handling

```python
from obp_client import OBPClient, OBPError, NetworkError

try:
    booking = client.bookings.create(...)
except OBPError as e:
    print(f"API error {e.status}: {e.title}")
    if e.is_conflict():
        print("Slot was taken by another customer — choose a different time")
    elif e.is_rate_limited():
        print("Rate limited — slow down")
except NetworkError as e:
    print(f"Network error: {e}")
```

## Provider management

```python
# List pending bookings
bookings = client.bookings.list(status="pending")

# Confirm a booking
confirmed = client.bookings.confirm(bookings.data[0].id)

# Mark no-show
client.bookings.no_show(booking_id)

# Cancel
client.bookings.cancel(booking_id, reason="Provider unavailable")
```

## License

MIT
