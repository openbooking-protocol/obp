"""OBP Python client."""
from __future__ import annotations

from typing import Any

from .http import request as _req
from .types import (
    Booking,
    BookingCustomer,
    CreateBookingInput,
    HoldSlotResponse,
    PaginatedResponse,
    Provider,
    ProviderContact,
    ProviderLocation,
    Service,
    ServicePrice,
    Slot,
    WellKnownObp,
)


def _parse_provider(d: dict) -> Provider:
    loc = d.get("location", {})
    contact = d.get("contact", {})
    return Provider(
        id=d["id"],
        name=d["name"],
        description=d.get("description", ""),
        category=d.get("category", "other"),
        location=ProviderLocation(
            address=loc.get("address", ""),
            city=loc.get("city", ""),
            country=loc.get("country", ""),
            postal_code=loc.get("postal_code"),
            latitude=loc.get("latitude"),
            longitude=loc.get("longitude"),
        ),
        timezone=d.get("timezone", "UTC"),
        contact=ProviderContact(
            email=contact.get("email"),
            phone=contact.get("phone"),
            website=contact.get("website"),
        ),
        status=d.get("status", "active"),
        logo_url=d.get("logo_url"),
        federation_url=d.get("federation_url"),
        metadata=d.get("metadata", {}),
        created_at=d.get("created_at", ""),
        updated_at=d.get("updated_at", ""),
    )


def _parse_service(d: dict) -> Service:
    price_raw = d.get("price")
    price = ServicePrice(amount=price_raw["amount"], currency=price_raw["currency"]) if price_raw else None
    return Service(
        id=d["id"],
        provider_id=d["provider_id"],
        name=d["name"],
        description=d.get("description", ""),
        duration_minutes=d.get("duration_minutes", 60),
        buffer_before_minutes=d.get("buffer_before_minutes", 0),
        buffer_after_minutes=d.get("buffer_after_minutes", 0),
        max_participants=d.get("max_participants", 1),
        requires_confirmation=d.get("requires_confirmation", False),
        tags=d.get("tags", []),
        active=d.get("active", True),
        price=price,
        metadata=d.get("metadata", {}),
        created_at=d.get("created_at", ""),
        updated_at=d.get("updated_at", ""),
    )


def _parse_slot(d: dict) -> Slot:
    return Slot(
        id=d["id"],
        service_id=d["service_id"],
        start_time=d["start_time"],
        end_time=d["end_time"],
        status=d.get("status", "available"),
        remaining_capacity=d.get("remaining_capacity", 1),
        resource_id=d.get("resource_id"),
    )


def _parse_booking(d: dict) -> Booking:
    c = d.get("customer", {})
    return Booking(
        id=d["id"],
        slot_id=d["slot_id"],
        service_id=d["service_id"],
        provider_id=d["provider_id"],
        customer=BookingCustomer(name=c.get("name", ""), email=c.get("email", ""), phone=c.get("phone")),
        status=d.get("status", "pending"),
        source=d.get("source", "direct"),
        version=d.get("version", 1),
        created_at=d.get("created_at", ""),
        updated_at=d.get("updated_at", ""),
        notes=d.get("notes"),
        source_server=d.get("source_server"),
        cancelled_at=d.get("cancelled_at"),
        cancellation_reason=d.get("cancellation_reason"),
    )


def _paginated(data: dict, parser) -> PaginatedResponse:
    pagination = data.get("pagination", {})
    return PaginatedResponse(
        data=[parser(item) for item in data.get("data", [])],
        total=pagination.get("total"),
        limit=pagination.get("limit", 20),
        has_more=pagination.get("has_more", False),
        next_cursor=pagination.get("next_cursor"),
    )


class OBPClient:
    """
    Official Python client for the OpenBooking Protocol.

    Usage::

        from obp_client import OBPClient

        client = OBPClient(base_url="https://obp.example.com", api_key="obpk_...")

        services = client.services.list(category="beauty")
        slots = client.slots.list(service_id=services.data[0].id, date_from="2026-04-01", date_to="2026-04-01")
        hold = client.slots.hold(slots.data[0].id)
        booking = client.bookings.create(
            slot_id=slots.data[0].id,
            hold_token=hold.hold_token,
            customer={"name": "Alice", "email": "alice@example.com"},
        )
    """

    def __init__(
        self,
        base_url: str,
        *,
        api_key: str | None = None,
        token: str | None = None,
        timeout_ms: int = 30_000,
        max_retries: int = 3,
    ):
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._token = token
        self._timeout_ms = timeout_ms
        self._max_retries = max_retries

        self.providers = _ProvidersResource(self)
        self.services = _ServicesResource(self)
        self.slots = _SlotsResource(self)
        self.bookings = _BookingsResource(self)

    def _get(self, path: str, params: dict | None = None, *, api_key: str | None = None) -> Any:
        return _req(
            self._base_url, path,
            method="GET", params=params,
            api_key=api_key or self._api_key,
            token=self._token,
            timeout_ms=self._timeout_ms,
            max_retries=self._max_retries,
        )

    def _post(self, path: str, body: Any = None, *, api_key: str | None = None) -> Any:
        return _req(
            self._base_url, path,
            method="POST", body=body,
            api_key=api_key or self._api_key,
            token=self._token,
            timeout_ms=self._timeout_ms,
            max_retries=self._max_retries,
        )

    def _put(self, path: str, body: Any = None, *, api_key: str | None = None) -> Any:
        return _req(
            self._base_url, path,
            method="PUT", body=body,
            api_key=api_key or self._api_key,
            token=self._token,
            timeout_ms=self._timeout_ms,
            max_retries=self._max_retries,
        )

    def _delete(self, path: str, *, api_key: str | None = None) -> Any:
        return _req(
            self._base_url, path,
            method="DELETE",
            api_key=api_key or self._api_key,
            token=self._token,
            timeout_ms=self._timeout_ms,
            max_retries=self._max_retries,
        )

    def discover(self) -> WellKnownObp:
        """Discover server capabilities via /.well-known/obp."""
        d = self._get("/.well-known/obp")
        return WellKnownObp(
            obp_version=d["obp_version"],
            server_url=d["server_url"],
            server_name=d["server_name"],
            federation_enabled=d.get("federation_enabled", False),
            features=d.get("features", []),
            public_key=d.get("public_key"),
        )

    def booking_calendar_url(self, booking_id: str) -> str:
        return f"{self._base_url}/bookings/{booking_id}/calendar.ics"

    def provider_calendar_url(self, provider_id: str) -> str:
        return f"{self._base_url}/providers/{provider_id}/calendar.ics"


class _ProvidersResource:
    def __init__(self, client: OBPClient):
        self._c = client

    def list(self, *, status: str | None = None, category: str | None = None,
             search: str | None = None, limit: int | None = None, cursor: str | None = None
             ) -> PaginatedResponse[Provider]:
        data = self._c._get("/obp/v1/providers", {"status": status, "category": category,
                                                    "search": search, "limit": limit, "cursor": cursor})
        return _paginated(data, _parse_provider)

    def get(self, id: str) -> Provider:
        return _parse_provider(self._c._get(f"/obp/v1/providers/{id}"))

    def categories(self) -> list[str]:
        return self._c._get("/obp/v1/categories")


class _ServicesResource:
    def __init__(self, client: OBPClient):
        self._c = client

    def list(self, *, provider_id: str | None = None, category: str | None = None,
             active: bool | None = None, search: str | None = None,
             limit: int | None = None, cursor: str | None = None
             ) -> PaginatedResponse[Service]:
        data = self._c._get("/obp/v1/services", {
            "provider_id": provider_id, "category": category,
            "active": active, "search": search, "limit": limit, "cursor": cursor,
        })
        return _paginated(data, _parse_service)

    def get(self, id: str) -> Service:
        return _parse_service(self._c._get(f"/obp/v1/services/{id}"))


class _SlotsResource:
    def __init__(self, client: OBPClient):
        self._c = client

    def list(self, *, service_id: str, date_from: str, date_to: str,
             resource_id: str | None = None, limit: int | None = None
             ) -> PaginatedResponse[Slot]:
        data = self._c._get("/obp/v1/slots", {
            "service_id": service_id, "date_from": date_from, "date_to": date_to,
            "resource_id": resource_id, "limit": limit,
        })
        return _paginated(data, _parse_slot)

    def get(self, id: str) -> Slot:
        return _parse_slot(self._c._get(f"/obp/v1/slots/{id}"))

    def hold(self, id: str) -> HoldSlotResponse:
        d = self._c._post(f"/obp/v1/slots/{id}/hold")
        return HoldSlotResponse(slot_id=d["slot_id"], hold_token=d["hold_token"], expires_at=d["expires_at"])


class _BookingsResource:
    def __init__(self, client: OBPClient):
        self._c = client

    def list(self, *, provider_id: str | None = None, status: str | None = None,
             date_from: str | None = None, date_to: str | None = None,
             limit: int | None = None, cursor: str | None = None
             ) -> PaginatedResponse[Booking]:
        data = self._c._get("/obp/v1/bookings", {
            "provider_id": provider_id, "status": status,
            "date_from": date_from, "date_to": date_to,
            "limit": limit, "cursor": cursor,
        })
        return _paginated(data, _parse_booking)

    def get(self, id: str) -> Booking:
        return _parse_booking(self._c._get(f"/obp/v1/bookings/{id}"))

    def create(self, *, slot_id: str, hold_token: str,
               customer: dict | BookingCustomer, notes: str | None = None) -> Booking:
        if isinstance(customer, BookingCustomer):
            customer_dict = {"name": customer.name, "email": customer.email, "phone": customer.phone}
        else:
            customer_dict = customer
        body = {"slot_id": slot_id, "hold_token": hold_token, "customer": customer_dict}
        if notes:
            body["notes"] = notes
        return _parse_booking(self._c._post("/obp/v1/bookings", body))

    def confirm(self, id: str) -> Booking:
        return _parse_booking(self._c._post(f"/obp/v1/bookings/{id}/confirm"))

    def cancel(self, id: str, reason: str | None = None) -> Booking:
        body = {"reason": reason} if reason else None
        return _parse_booking(self._c._post(f"/obp/v1/bookings/{id}/cancel", body))

    def complete(self, id: str) -> Booking:
        return _parse_booking(self._c._post(f"/obp/v1/bookings/{id}/complete"))

    def no_show(self, id: str) -> Booking:
        return _parse_booking(self._c._post(f"/obp/v1/bookings/{id}/no-show"))
