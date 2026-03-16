"""OpenBooking Protocol Python Client."""

from .client import OBPClient
from .errors import OBPError, NetworkError, TimeoutError
from .types import (
    Provider,
    ProviderLocation,
    ProviderContact,
    Service,
    ServicePrice,
    CancellationPolicy,
    Resource,
    Schedule,
    RecurringRule,
    ScheduleException,
    Slot,
    HoldSlotResponse,
    Booking,
    BookingCustomer,
    CreateBookingInput,
    Webhook,
    WellKnownObp,
    PaginatedResponse,
)

__version__ = "0.1.0"
__all__ = [
    "OBPClient",
    "OBPError",
    "NetworkError",
    "TimeoutError",
    "Provider",
    "ProviderLocation",
    "ProviderContact",
    "Service",
    "ServicePrice",
    "CancellationPolicy",
    "Resource",
    "Schedule",
    "RecurringRule",
    "ScheduleException",
    "Slot",
    "HoldSlotResponse",
    "Booking",
    "BookingCustomer",
    "CreateBookingInput",
    "Webhook",
    "WellKnownObp",
    "PaginatedResponse",
]
