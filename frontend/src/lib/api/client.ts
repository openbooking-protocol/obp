import type {
  Booking,
  BookingCustomer,
  CreateBookingInput,
  CreateProviderInput,
  CreateServiceInput,
  FederationPeer,
  HoldSlotResponse,
  PaginatedResponse,
  Provider,
  ProviderAnalytics,
  Resource,
  Schedule,
  ServerStats,
  Service,
  Slot,
  Webhook,
  WebhookEventType,
  WellKnownObp,
} from "./types";

// ── Config ────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3000";

// ── Error ─────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail?: string,
    public type?: string
  ) {
    super(title);
    this.name = "ApiError";
  }
}

// ── Base fetch ────────────────────────────────────────────────────────────

interface FetchOptions {
  method?: string;
  body?: unknown;
  apiKey?: string;
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, apiKey, token, params } = options;

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (apiKey) headers["X-Api-Key"] = apiKey;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    let problem: { title?: string; detail?: string; type?: string } = {};
    try {
      problem = await res.json();
    } catch {
      // ignore
    }
    throw new ApiError(
      res.status,
      problem.title ?? res.statusText,
      problem.detail,
      problem.type
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── OBP API Client ────────────────────────────────────────────────────────

export const obpApi = {
  // ── Discovery ────────────────────────────────────────────────────────

  discovery: {
    wellKnown(): Promise<WellKnownObp> {
      return apiFetch("/.well-known/obp");
    },
  },

  // ── Providers ────────────────────────────────────────────────────────

  providers: {
    list(params?: {
      limit?: number;
      cursor?: string;
      status?: string;
      category?: string;
      search?: string;
    }): Promise<PaginatedResponse<Provider>> {
      return apiFetch("/obp/v1/providers", { params });
    },

    get(id: string): Promise<Provider> {
      return apiFetch(`/obp/v1/providers/${id}`);
    },

    create(input: CreateProviderInput, apiKey: string): Promise<Provider> {
      return apiFetch("/obp/v1/providers", { method: "POST", body: input, apiKey });
    },

    update(
      id: string,
      input: Partial<CreateProviderInput>,
      apiKey: string
    ): Promise<Provider> {
      return apiFetch(`/obp/v1/providers/${id}`, {
        method: "PUT",
        body: input,
        apiKey,
      });
    },

    approve(id: string, apiKey: string): Promise<Provider> {
      return apiFetch(`/admin/providers/${id}/approve`, {
        method: "POST",
        apiKey,
      });
    },

    suspend(id: string, apiKey: string): Promise<Provider> {
      return apiFetch(`/admin/providers/${id}/suspend`, {
        method: "POST",
        apiKey,
      });
    },

    delete(id: string, apiKey: string): Promise<void> {
      return apiFetch(`/admin/providers/${id}`, { method: "DELETE", apiKey });
    },
  },

  // ── Categories ────────────────────────────────────────────────────────

  categories: {
    list(): Promise<string[]> {
      return apiFetch("/obp/v1/categories");
    },
  },

  // ── Services ──────────────────────────────────────────────────────────

  services: {
    list(params?: {
      provider_id?: string;
      category?: string;
      active?: boolean;
      search?: string;
      limit?: number;
      cursor?: string;
    }): Promise<PaginatedResponse<Service>> {
      return apiFetch("/obp/v1/services", { params });
    },

    get(id: string): Promise<Service> {
      return apiFetch(`/obp/v1/services/${id}`);
    },

    create(
      providerId: string,
      input: CreateServiceInput,
      apiKey: string
    ): Promise<Service> {
      return apiFetch("/obp/v1/services", {
        method: "POST",
        body: { provider_id: providerId, ...input },
        apiKey,
      });
    },

    update(id: string, input: Partial<CreateServiceInput>, apiKey: string): Promise<Service> {
      return apiFetch(`/obp/v1/services/${id}`, {
        method: "PUT",
        body: input,
        apiKey,
      });
    },

    delete(id: string, apiKey: string): Promise<void> {
      return apiFetch(`/obp/v1/services/${id}`, { method: "DELETE", apiKey });
    },
  },

  // ── Slots ─────────────────────────────────────────────────────────────

  slots: {
    list(params: {
      service_id: string;
      date_from: string;
      date_to: string;
      resource_id?: string;
      limit?: number;
    }): Promise<PaginatedResponse<Slot>> {
      return apiFetch("/obp/v1/slots", { params });
    },

    get(id: string): Promise<Slot> {
      return apiFetch(`/obp/v1/slots/${id}`);
    },

    hold(id: string): Promise<HoldSlotResponse> {
      return apiFetch(`/obp/v1/slots/${id}/hold`, { method: "POST" });
    },
  },

  // ── Bookings ──────────────────────────────────────────────────────────

  bookings: {
    list(
      params?: {
        provider_id?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
        limit?: number;
        cursor?: string;
      },
      apiKey?: string
    ): Promise<PaginatedResponse<Booking>> {
      return apiFetch("/obp/v1/bookings", { params, apiKey });
    },

    get(id: string): Promise<Booking> {
      return apiFetch(`/obp/v1/bookings/${id}`);
    },

    create(input: CreateBookingInput): Promise<Booking> {
      return apiFetch("/obp/v1/bookings", { method: "POST", body: input });
    },

    confirm(id: string, apiKey: string): Promise<Booking> {
      return apiFetch(`/obp/v1/bookings/${id}/confirm`, { method: "POST", apiKey });
    },

    cancel(id: string, reason?: string, apiKey?: string): Promise<Booking> {
      return apiFetch(`/obp/v1/bookings/${id}/cancel`, {
        method: "POST",
        body: reason ? { reason } : undefined,
        apiKey,
      });
    },

    complete(id: string, apiKey: string): Promise<Booking> {
      return apiFetch(`/obp/v1/bookings/${id}/complete`, { method: "POST", apiKey });
    },

    noShow(id: string, apiKey: string): Promise<Booking> {
      return apiFetch(`/obp/v1/bookings/${id}/no-show`, { method: "POST", apiKey });
    },

    createManual(
      input: { slot_id: string; customer: BookingCustomer; notes?: string },
      apiKey: string
    ): Promise<Booking> {
      return apiFetch("/obp/v1/bookings/manual", {
        method: "POST",
        body: input,
        apiKey,
      });
    },
  },

  // ── Schedule ──────────────────────────────────────────────────────────

  schedule: {
    get(providerId: string, apiKey: string): Promise<Schedule> {
      return apiFetch(`/obp/v1/schedule?provider_id=${providerId}`, { apiKey });
    },

    upsert(
      input: Omit<Schedule, "id" | "created_at" | "updated_at">,
      apiKey: string
    ): Promise<Schedule> {
      return apiFetch("/obp/v1/schedule", { method: "PUT", body: input, apiKey });
    },
  },

  // ── Resources ─────────────────────────────────────────────────────────

  resources: {
    list(
      params?: { provider_id?: string; type?: string },
      apiKey?: string
    ): Promise<PaginatedResponse<Resource>> {
      return apiFetch("/obp/v1/resources", { params, apiKey });
    },

    get(id: string, apiKey: string): Promise<Resource> {
      return apiFetch(`/obp/v1/resources/${id}`, { apiKey });
    },
  },

  // ── Webhooks ──────────────────────────────────────────────────────────

  webhooks: {
    list(providerId: string, apiKey: string): Promise<PaginatedResponse<Webhook>> {
      return apiFetch(`/obp/v1/webhooks?provider_id=${providerId}`, { apiKey });
    },

    create(
      input: { provider_id: string; url: string; events: WebhookEventType[] },
      apiKey: string
    ): Promise<Webhook> {
      return apiFetch("/obp/v1/webhooks", { method: "POST", body: input, apiKey });
    },

    delete(id: string, apiKey: string): Promise<void> {
      return apiFetch(`/obp/v1/webhooks/${id}`, { method: "DELETE", apiKey });
    },
  },

  // ── Analytics ─────────────────────────────────────────────────────────

  analytics: {
    provider(
      providerId: string,
      params: { from: string; to: string },
      apiKey: string
    ): Promise<ProviderAnalytics> {
      return apiFetch(`/analytics/providers/${providerId}`, { params, apiKey });
    },
  },

  // ── Admin ─────────────────────────────────────────────────────────────

  admin: {
    stats(apiKey: string): Promise<ServerStats> {
      return apiFetch("/admin/stats", { apiKey });
    },

    federationPeers(apiKey: string): Promise<PaginatedResponse<FederationPeer>> {
      return apiFetch("/federation/peers", { apiKey });
    },

    addFederationPeer(
      input: { server_url: string; name?: string },
      apiKey: string
    ): Promise<FederationPeer> {
      return apiFetch("/federation/peers", { method: "POST", body: input, apiKey });
    },

    removeFederationPeer(id: string, apiKey: string): Promise<void> {
      return apiFetch(`/federation/peers/${id}`, { method: "DELETE", apiKey });
    },
  },

  // ── Auth ──────────────────────────────────────────────────────────────

  auth: {
    generateApiKey(
      providerId: string,
      scopes: string[],
      adminKey: string
    ): Promise<{ key: string; id: string }> {
      return apiFetch("/obp/v1/auth/keys", {
        method: "POST",
        body: { provider_id: providerId, scopes },
        apiKey: adminKey,
      });
    },
  },
};

// ── Calendar URLs ─────────────────────────────────────────────────────────

export function providerCalendarUrl(providerId: string): string {
  return `${BASE_URL}/providers/${providerId}/calendar.ics`;
}

export function bookingCalendarUrl(bookingId: string): string {
  return `${BASE_URL}/bookings/${bookingId}/calendar.ics`;
}
