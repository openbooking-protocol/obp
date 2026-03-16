"""OBP client errors."""


class OBPError(Exception):
    """Raised when the OBP server returns an error response (4xx / 5xx)."""

    def __init__(self, status: int, title: str, type_: str = "", detail: str | None = None, instance: str | None = None):
        super().__init__(title)
        self.status = status
        self.title = title
        self.type = type_
        self.detail = detail
        self.instance = instance

    def is_not_found(self) -> bool:
        return self.status == 404

    def is_unauthorized(self) -> bool:
        return self.status == 401

    def is_forbidden(self) -> bool:
        return self.status == 403

    def is_conflict(self) -> bool:
        return self.status == 409

    def is_rate_limited(self) -> bool:
        return self.status == 429

    def is_server_error(self) -> bool:
        return self.status >= 500

    def __repr__(self) -> str:
        return f"OBPError(status={self.status}, title={self.title!r})"


class NetworkError(Exception):
    """Raised when a network-level error occurs (connection refused, DNS, etc.)."""


class TimeoutError(Exception):
    """Raised when a request exceeds the configured timeout."""

    def __init__(self, timeout_ms: int):
        super().__init__(f"Request timed out after {timeout_ms}ms")
        self.timeout_ms = timeout_ms
