export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  required: boolean;
}

export interface ValidationReport {
  serverUrl: string;
  timestamp: string;
  passed: number;
  failed: number;
  warnings: number;
  checks: CheckResult[];
  compliant: boolean;
}

async function fetchJson(url: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...options.headers },
      signal: AbortSignal.timeout(10_000),
    });
    let data: unknown = null;
    try { data = await res.json(); } catch { /* ignore */ }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

function check(name: string, passed: boolean, message: string, required = true): CheckResult {
  return { name, passed, message, required };
}

export async function runChecks(serverUrl: string, apiKey?: string): Promise<ValidationReport> {
  const base = serverUrl.replace(/\/$/, "");
  const headers: Record<string, string> = {};
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const checks: CheckResult[] = [];

  // ── 1. Well-known discovery ──────────────────────────────────────────────
  {
    const res = await fetchJson(`${base}/.well-known/obp`);
    const data = res.data as Record<string, unknown> | null;
    checks.push(check(
      "GET /.well-known/obp — 200 OK",
      res.ok,
      res.ok ? "Discovery endpoint returns 200" : `Expected 200, got ${res.status}`
    ));
    if (res.ok && data) {
      checks.push(check(
        "Discovery — obp_version present",
        typeof data["obp_version"] === "string",
        typeof data["obp_version"] === "string" ? `obp_version = ${data["obp_version"]}` : "Missing obp_version field"
      ));
      checks.push(check(
        "Discovery — server_url present",
        typeof data["server_url"] === "string",
        typeof data["server_url"] === "string" ? "server_url present" : "Missing server_url field"
      ));
    }
  }

  // ── 2. Health check ──────────────────────────────────────────────────────
  {
    const res = await fetchJson(`${base}/health`);
    checks.push(check(
      "GET /health — 200 OK",
      res.ok,
      res.ok ? "Health endpoint OK" : `Expected 200, got ${res.status}`,
      false // optional
    ));
  }

  // ── 3. Providers list ────────────────────────────────────────────────────
  let serviceId: string | null = null;
  {
    const res = await fetchJson(`${base}/obp/v1/providers?limit=5`);
    const data = res.data as Record<string, unknown> | null;
    checks.push(check(
      "GET /obp/v1/providers — 200 OK",
      res.ok,
      res.ok ? "Providers endpoint OK" : `Expected 200, got ${res.status}`
    ));
    if (res.ok && data && Array.isArray(data["data"])) {
      checks.push(check(
        "Providers — returns paginated response",
        "pagination" in data,
        "pagination" in data ? "Pagination object present" : "Missing pagination object"
      ));
    }
  }

  // ── 4. Services list ─────────────────────────────────────────────────────
  {
    const res = await fetchJson(`${base}/obp/v1/services?limit=5`);
    const data = res.data as Record<string, unknown> | null;
    checks.push(check(
      "GET /obp/v1/services — 200 OK",
      res.ok,
      res.ok ? "Services endpoint OK" : `Expected 200, got ${res.status}`
    ));
    if (res.ok && data && Array.isArray(data["data"]) && (data["data"] as unknown[]).length > 0) {
      const first = (data["data"] as Record<string, unknown>[])[0]!;
      serviceId = first["id"] as string;
      const hasRequiredFields = ["id", "provider_id", "name", "duration_minutes", "active"].every(
        (f) => f in first
      );
      checks.push(check(
        "Service object — required fields present",
        hasRequiredFields,
        hasRequiredFields ? "Service schema OK" : "Service missing required fields"
      ));
    }
  }

  // ── 5. Slots ─────────────────────────────────────────────────────────────
  if (serviceId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0]!;
    const res = await fetchJson(
      `${base}/obp/v1/slots?service_id=${serviceId}&date_from=${dateStr}&date_to=${dateStr}`
    );
    checks.push(check(
      "GET /obp/v1/slots — 200 OK",
      res.ok,
      res.ok ? "Slots endpoint OK" : `Expected 200, got ${res.status}`
    ));
  }

  // ── 6. Error format (RFC 7807) ───────────────────────────────────────────
  {
    const res = await fetchJson(`${base}/obp/v1/providers/nonexistent-uuid-that-does-not-exist`);
    const data = res.data as Record<string, unknown> | null;
    if (!res.ok && data) {
      const isRfc7807 = typeof data["type"] === "string" && typeof data["title"] === "string" && typeof data["status"] === "number";
      checks.push(check(
        "Error format — RFC 7807 Problem Details",
        isRfc7807,
        isRfc7807 ? "Errors use RFC 7807 format" : "Error response missing type/title/status fields"
      ));
    }
  }

  // ── 7. Booking creation with invalid data ────────────────────────────────
  {
    const res = await fetchJson(`${base}/obp/v1/bookings`, {
      method: "POST",
      body: JSON.stringify({ invalid: "data" }),
    });
    checks.push(check(
      "POST /obp/v1/bookings — 422 on invalid body",
      res.status === 422 || res.status === 400,
      res.status === 422 || res.status === 400
        ? `Correctly returns ${res.status} for invalid input`
        : `Expected 422/400, got ${res.status}`
    ));
  }

  // ── 8. Rate limit headers ────────────────────────────────────────────────
  {
    try {
      const res = await fetch(`${base}/obp/v1/services`, { signal: AbortSignal.timeout(10_000) });
      const hasRateLimit = res.headers.has("X-RateLimit-Limit") || res.headers.has("x-ratelimit-limit");
      checks.push(check(
        "Rate limit headers present",
        hasRateLimit,
        hasRateLimit ? "X-RateLimit-* headers present" : "Missing X-RateLimit-* headers",
        false // recommended but not required
      ));
    } catch {
      /* ignore */
    }
  }

  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed && c.required).length;
  const warnings = checks.filter((c) => !c.passed && !c.required).length;

  return {
    serverUrl: base,
    timestamp: new Date().toISOString(),
    passed,
    failed,
    warnings,
    checks,
    compliant: failed === 0,
  };
}
