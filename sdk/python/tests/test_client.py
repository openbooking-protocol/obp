"""Tests for OBP Python client."""
import json
from unittest.mock import MagicMock, patch
import pytest
from obp_client import OBPClient, OBPError


BASE_URL = "https://obp.example.com"


def make_response(status: int, body: dict):
    mock = MagicMock()
    mock.status = status
    mock.read.return_value = json.dumps(body).encode()
    mock.headers = MagicMock()
    mock.headers.get.return_value = None
    mock.__enter__ = lambda s: s
    mock.__exit__ = MagicMock(return_value=False)
    return mock


class TestOBPClientInit:
    def test_basic_construction(self):
        client = OBPClient(BASE_URL)
        assert client is not None
        assert client.providers is not None
        assert client.services is not None
        assert client.slots is not None
        assert client.bookings is not None

    def test_strips_trailing_slash(self):
        client = OBPClient(f"{BASE_URL}/")
        assert client.booking_calendar_url("bkg_1") == f"{BASE_URL}/bookings/bkg_1/calendar.ics"

    def test_calendar_urls(self):
        client = OBPClient(BASE_URL)
        assert client.booking_calendar_url("bkg_abc") == f"{BASE_URL}/bookings/bkg_abc/calendar.ics"
        assert client.provider_calendar_url("prv_xyz") == f"{BASE_URL}/providers/prv_xyz/calendar.ics"


class TestDiscover:
    def test_discover(self):
        response_body = {
            "obp_version": "1.0.0",
            "server_url": BASE_URL,
            "server_name": "Test Server",
            "federation_enabled": True,
            "features": ["webhooks", "ical"],
        }
        with patch("urllib.request.urlopen") as mock_urlopen:
            mock_urlopen.return_value = make_response(200, response_body)
            client = OBPClient(BASE_URL)
            info = client.discover()
            assert info.obp_version == "1.0.0"
            assert info.federation_enabled is True
            assert "webhooks" in info.features


class TestProviders:
    def test_list_providers(self):
        response_body = {
            "data": [
                {
                    "id": "prv_1",
                    "name": "Salon ABC",
                    "description": "A great salon",
                    "category": "beauty",
                    "location": {"address": "Main St 1", "city": "Belgrade", "country": "RS"},
                    "timezone": "Europe/Belgrade",
                    "contact": {"email": "salon@example.com"},
                    "status": "active",
                }
            ],
            "pagination": {"limit": 20, "has_more": False},
        }
        with patch("urllib.request.urlopen") as mock_urlopen:
            mock_urlopen.return_value = make_response(200, response_body)
            client = OBPClient(BASE_URL)
            result = client.providers.list(category="beauty")
            assert len(result.data) == 1
            provider = result.data[0]
            assert provider.id == "prv_1"
            assert provider.name == "Salon ABC"
            assert provider.location.city == "Belgrade"


class TestSlots:
    def test_hold_slot(self):
        response_body = {
            "slot_id": "slt_1",
            "hold_token": "tok_abc123",
            "expires_at": "2026-04-01T10:10:00Z",
        }
        with patch("urllib.request.urlopen") as mock_urlopen:
            mock_urlopen.return_value = make_response(200, response_body)
            client = OBPClient(BASE_URL)
            hold = client.slots.hold("slt_1")
            assert hold.hold_token == "tok_abc123"
            assert hold.slot_id == "slt_1"


class TestBookings:
    def test_create_booking(self):
        response_body = {
            "id": "bkg_1",
            "slot_id": "slt_1",
            "service_id": "svc_1",
            "provider_id": "prv_1",
            "customer": {"name": "Alice", "email": "alice@example.com"},
            "status": "pending",
            "source": "direct",
            "version": 1,
            "created_at": "2026-04-01T10:00:00Z",
            "updated_at": "2026-04-01T10:00:00Z",
        }
        with patch("urllib.request.urlopen") as mock_urlopen:
            mock_urlopen.return_value = make_response(200, response_body)
            client = OBPClient(BASE_URL)
            booking = client.bookings.create(
                slot_id="slt_1",
                hold_token="tok_abc",
                customer={"name": "Alice", "email": "alice@example.com"},
            )
            assert booking.id == "bkg_1"
            assert booking.status == "pending"
            assert booking.customer.name == "Alice"

    def test_cancel_booking(self):
        response_body = {
            "id": "bkg_1",
            "slot_id": "slt_1",
            "service_id": "svc_1",
            "provider_id": "prv_1",
            "customer": {"name": "Alice", "email": "alice@example.com"},
            "status": "cancelled",
            "source": "direct",
            "version": 2,
            "created_at": "2026-04-01T10:00:00Z",
            "updated_at": "2026-04-01T10:05:00Z",
            "cancelled_at": "2026-04-01T10:05:00Z",
        }
        with patch("urllib.request.urlopen") as mock_urlopen:
            mock_urlopen.return_value = make_response(200, response_body)
            client = OBPClient(BASE_URL)
            booking = client.bookings.cancel("bkg_1", reason="Changed my mind")
            assert booking.status == "cancelled"


class TestErrors:
    def test_obp_error_on_404(self):
        import urllib.error
        error = urllib.error.HTTPError(
            url=f"{BASE_URL}/obp/v1/providers/nonexistent",
            code=404,
            msg="Not Found",
            hdrs=MagicMock(get=lambda k, d=None: d),
            fp=MagicMock(read=lambda: json.dumps({
                "type": "https://obp.dev/errors/not-found",
                "title": "Provider not found",
                "status": 404,
            }).encode()),
        )
        with patch("urllib.request.urlopen", side_effect=error):
            client = OBPClient(BASE_URL, max_retries=1)
            with pytest.raises(OBPError) as exc_info:
                client.providers.get("nonexistent")
            assert exc_info.value.status == 404
            assert exc_info.value.is_not_found() is True

    def test_conflict_error(self):
        import urllib.error
        error = urllib.error.HTTPError(
            url=f"{BASE_URL}/obp/v1/slots/slt_1/hold",
            code=409,
            msg="Conflict",
            hdrs=MagicMock(get=lambda k, d=None: d),
            fp=MagicMock(read=lambda: json.dumps({
                "type": "https://obp.dev/errors/slot-unavailable",
                "title": "Slot unavailable",
                "status": 409,
                "detail": "Slot was booked by another customer",
            }).encode()),
        )
        with patch("urllib.request.urlopen", side_effect=error):
            client = OBPClient(BASE_URL, max_retries=1)
            with pytest.raises(OBPError) as exc_info:
                client.slots.hold("slt_1")
            assert exc_info.value.is_conflict() is True
            assert exc_info.value.detail == "Slot was booked by another customer"
