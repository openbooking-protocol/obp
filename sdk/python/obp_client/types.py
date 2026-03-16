"""OBP data types."""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Generic, Literal, TypeVar

T = TypeVar("T")


@dataclass
class PaginatedResponse(Generic[T]):
    data: list[T]
    total: int | None
    limit: int
    has_more: bool
    next_cursor: str | None = None


@dataclass
class ProviderLocation:
    address: str
    city: str
    country: str
    postal_code: str | None = None
    latitude: float | None = None
    longitude: float | None = None


@dataclass
class ProviderContact:
    email: str | None = None
    phone: str | None = None
    website: str | None = None


@dataclass
class Provider:
    id: str
    name: str
    description: str
    category: str
    location: ProviderLocation
    timezone: str
    contact: ProviderContact
    status: str
    logo_url: str | None = None
    federation_url: str | None = None
    metadata: dict[str, str] = field(default_factory=dict)
    created_at: str = ""
    updated_at: str = ""


@dataclass
class ServicePrice:
    amount: int
    currency: str


@dataclass
class CancellationPolicy:
    deadline_hours: int
    fee_percent: float | None = None
    fee_fixed: int | None = None


@dataclass
class Service:
    id: str
    provider_id: str
    name: str
    description: str
    duration_minutes: int
    buffer_before_minutes: int
    buffer_after_minutes: int
    max_participants: int
    requires_confirmation: bool
    tags: list[str]
    active: bool
    price: ServicePrice | None = None
    cancellation_policy: CancellationPolicy | None = None
    metadata: dict[str, str] = field(default_factory=dict)
    created_at: str = ""
    updated_at: str = ""


@dataclass
class Resource:
    id: str
    provider_id: str
    type: str
    name: str
    services: list[str]
    active: bool
    created_at: str = ""
    updated_at: str = ""


@dataclass
class RecurringRule:
    day_of_week: int
    start_time: str
    end_time: str


@dataclass
class ScheduleException:
    date: str
    available: bool
    start_time: str | None = None
    end_time: str | None = None
    reason: str | None = None


@dataclass
class Schedule:
    id: str
    provider_id: str
    timezone: str
    recurring_rules: list[RecurringRule]
    exceptions: list[ScheduleException]
    resource_id: str | None = None
    effective_from: str | None = None
    effective_until: str | None = None
    created_at: str = ""
    updated_at: str = ""


@dataclass
class Slot:
    id: str
    service_id: str
    start_time: str
    end_time: str
    status: str
    remaining_capacity: int
    resource_id: str | None = None
    price_override: ServicePrice | None = None


@dataclass
class HoldSlotResponse:
    slot_id: str
    hold_token: str
    expires_at: str


@dataclass
class BookingCustomer:
    name: str
    email: str
    phone: str | None = None


@dataclass
class CreateBookingInput:
    slot_id: str
    hold_token: str
    customer: BookingCustomer
    notes: str | None = None


@dataclass
class Booking:
    id: str
    slot_id: str
    service_id: str
    provider_id: str
    customer: BookingCustomer
    status: str
    source: str
    version: int
    created_at: str
    updated_at: str
    notes: str | None = None
    source_server: str | None = None
    cancelled_at: str | None = None
    cancellation_reason: str | None = None


@dataclass
class Webhook:
    id: str
    provider_id: str
    url: str
    events: list[str]
    active: bool
    created_at: str = ""
    updated_at: str = ""


@dataclass
class WellKnownObp:
    obp_version: str
    server_url: str
    server_name: str
    federation_enabled: bool
    features: list[str]
    public_key: str | None = None
