import { describe, it, expect, vi, beforeEach } from "vitest";
import { OBPClient, OBPError, NetworkError } from "../index.js";

const BASE_URL = "https://obp.example.com";

function makeMockFetch(response: { status: number; body: unknown; headers?: Record<string, string> }) {
  return vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: "OK",
    headers: {
      get: (key: string) => response.headers?.[key] ?? null,
    },
    json: () => Promise.resolve(response.body),
  });
}

describe("OBPClient", () => {
  it("requires baseUrl", () => {
    // @ts-expect-error — intentionally missing baseUrl
    expect(() => new OBPClient({})).toThrow("baseUrl is required");
  });

  it("constructs with valid config", () => {
    const client = new OBPClient({ baseUrl: BASE_URL });
    expect(client).toBeDefined();
    expect(client.providers).toBeDefined();
    expect(client.services).toBeDefined();
    expect(client.slots).toBeDefined();
    expect(client.bookings).toBeDefined();
  });

  it("strips trailing slash from baseUrl", () => {
    const client = new OBPClient({ baseUrl: `${BASE_URL}/` });
    expect(client.bookingCalendarUrl("bkg_1")).toBe(`${BASE_URL}/bookings/bkg_1/calendar.ics`);
  });

  describe("discover()", () => {
    it("calls /.well-known/obp", async () => {
      const mockFetch = makeMockFetch({
        status: 200,
        body: { obp_version: "1.0.0", server_url: BASE_URL, server_name: "Test", federation_enabled: true, features: [] },
      });
      const client = new OBPClient({ baseUrl: BASE_URL, fetch: mockFetch });
      const result = await client.discover();
      expect(result.obp_version).toBe("1.0.0");
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0] as [string];
      expect(url).toBe(`${BASE_URL}/.well-known/obp`);
    });
  });

  describe("providers.list()", () => {
    it("fetches providers with params", async () => {
      const mockFetch = makeMockFetch({
        status: 200,
        body: { data: [], pagination: { limit: 20, has_more: false } },
      });
      const client = new OBPClient({ baseUrl: BASE_URL, fetch: mockFetch });
      await client.providers.list({ category: "health", limit: 10 });
      const [url] = mockFetch.mock.calls[0] as [string];
      expect(url).toContain("category=health");
      expect(url).toContain("limit=10");
    });
  });

  describe("slots.hold()", () => {
    it("sends POST to /slots/:id/hold", async () => {
      const mockFetch = makeMockFetch({
        status: 200,
        body: { slot_id: "slt_1", hold_token: "tok_abc", expires_at: new Date().toISOString() },
      });
      const client = new OBPClient({ baseUrl: BASE_URL, fetch: mockFetch });
      const result = await client.slots.hold("slt_1");
      expect(result.hold_token).toBe("tok_abc");
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/obp/v1/slots/slt_1/hold`);
      expect(init.method).toBe("POST");
    });
  });

  describe("bookings.create()", () => {
    it("sends booking data and returns booking", async () => {
      const booking = {
        id: "bkg_1",
        slot_id: "slt_1",
        service_id: "svc_1",
        provider_id: "prv_1",
        customer: { name: "Alice", email: "alice@example.com" },
        status: "pending",
        source: "direct",
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const mockFetch = makeMockFetch({ status: 200, body: booking });
      const client = new OBPClient({ baseUrl: BASE_URL, fetch: mockFetch });
      const result = await client.bookings.create({
        slot_id: "slt_1",
        hold_token: "tok_abc",
        customer: { name: "Alice", email: "alice@example.com" },
      });
      expect(result.id).toBe("bkg_1");
    });
  });

  describe("error handling", () => {
    it("throws OBPError for 4xx responses", async () => {
      const mockFetch = makeMockFetch({
        status: 404,
        body: { type: "https://obp.dev/errors/not-found", title: "Not found", status: 404 },
      });
      const client = new OBPClient({ baseUrl: BASE_URL, fetch: mockFetch, maxRetries: 1 });
      await expect(client.providers.get("nonexistent")).rejects.toThrow(OBPError);
    });

    it("OBPError has correct properties", async () => {
      const mockFetch = makeMockFetch({
        status: 409,
        body: {
          type: "https://obp.dev/errors/slot-unavailable",
          title: "Slot unavailable",
          status: 409,
          detail: "Slot was booked by another customer",
        },
      });
      const client = new OBPClient({ baseUrl: BASE_URL, fetch: mockFetch, maxRetries: 1 });
      try {
        await client.slots.hold("slt_1");
      } catch (err) {
        expect(err).toBeInstanceOf(OBPError);
        const obpErr = err as OBPError;
        expect(obpErr.status).toBe(409);
        expect(obpErr.isConflict()).toBe(true);
        expect(obpErr.detail).toBe("Slot was booked by another customer");
      }
    });

    it("retries on 503 and eventually throws", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        headers: { get: () => null },
        json: () => Promise.resolve({ type: "err", title: "Service Unavailable", status: 503 }),
      });
      const client = new OBPClient({ baseUrl: BASE_URL, fetch: mockFetch, maxRetries: 2 });
      await expect(client.discover()).rejects.toThrow(OBPError);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("API key auth", () => {
    it("sends X-Api-Key header", async () => {
      const mockFetch = makeMockFetch({
        status: 200,
        body: { data: [], pagination: { limit: 20, has_more: false } },
      });
      const client = new OBPClient({ baseUrl: BASE_URL, apiKey: "obpk_secret", fetch: mockFetch });
      await client.bookings.list();
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("obpk_secret");
    });
  });

  describe("calendarUrl helpers", () => {
    it("returns correct booking calendar URL", () => {
      const client = new OBPClient({ baseUrl: BASE_URL });
      expect(client.bookingCalendarUrl("bkg_abc")).toBe(`${BASE_URL}/bookings/bkg_abc/calendar.ics`);
    });

    it("returns correct provider calendar URL", () => {
      const client = new OBPClient({ baseUrl: BASE_URL });
      expect(client.providerCalendarUrl("prv_xyz")).toBe(`${BASE_URL}/providers/prv_xyz/calendar.ics`);
    });
  });
});
