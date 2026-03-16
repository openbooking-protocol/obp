"""HTTP transport layer — uses urllib (stdlib only, zero dependencies)."""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from .errors import NetworkError, OBPError, TimeoutError as OBPTimeoutError

RETRY_STATUSES = {408, 429, 500, 502, 503, 504}


def _sleep(seconds: float) -> None:
    time.sleep(seconds)


def request(
    base_url: str,
    path: str,
    *,
    method: str = "GET",
    params: dict[str, Any] | None = None,
    body: Any = None,
    api_key: str | None = None,
    token: str | None = None,
    timeout_ms: int = 30_000,
    max_retries: int = 3,
) -> Any:
    """Make an HTTP request to the OBP server and return the parsed JSON body."""
    url = base_url.rstrip("/") + path
    if params:
        filtered = {k: str(v) for k, v in params.items() if v is not None}
        if filtered:
            url += "?" + urllib.parse.urlencode(filtered)

    headers: dict[str, str] = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if api_key:
        headers["X-Api-Key"] = api_key
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = json.dumps(body).encode() if body is not None else None
    timeout_s = timeout_ms / 1000.0

    for attempt in range(1, max_retries + 1):
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout_s) as res:
                if res.status == 204:
                    return None
                return json.loads(res.read())
        except urllib.error.HTTPError as exc:
            try:
                problem = json.loads(exc.read())
            except Exception:
                problem = {}
            status = exc.code
            if status in RETRY_STATUSES and attempt < max_retries:
                retry_after = exc.headers.get("Retry-After")
                delay = float(retry_after) if retry_after else min(2 ** (attempt - 1), 10)
                _sleep(delay)
                continue
            raise OBPError(
                status=status,
                title=problem.get("title", exc.reason or "HTTP Error"),
                type_=problem.get("type", ""),
                detail=problem.get("detail"),
                instance=problem.get("instance"),
            ) from exc
        except TimeoutError as exc:
            if attempt < max_retries:
                _sleep(min(2 ** (attempt - 1), 10))
                continue
            raise OBPTimeoutError(timeout_ms) from exc
        except (urllib.error.URLError, OSError) as exc:
            if attempt < max_retries:
                _sleep(min(2 ** (attempt - 1), 10))
                continue
            raise NetworkError(f"Network error: {exc}") from exc

    raise NetworkError("Max retries exceeded")
