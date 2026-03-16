import { httpRequest } from "../http.js";
import type {
  OBPClientConfig,
  PaginatedResponse,
  Booking,
  CreateBookingInput,
} from "../types.js";

type Config = Required<Pick<OBPClientConfig, "baseUrl" | "timeout" | "maxRetries">> & Pick<OBPClientConfig, "apiKey" | "token" | "fetch">;

export class BookingsResource {
  constructor(private readonly config: Config) {}

  list(params?: {
    provider_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    cursor?: string;
  }, apiKey?: string): Promise<PaginatedResponse<Booking>> {
    return httpRequest(this.config, "/obp/v1/bookings", { params, apiKey });
  }

  get(id: string): Promise<Booking> {
    return httpRequest(this.config, `/obp/v1/bookings/${id}`);
  }

  create(input: CreateBookingInput): Promise<Booking> {
    return httpRequest(this.config, "/obp/v1/bookings", {
      method: "POST",
      body: input,
    });
  }

  confirm(id: string, apiKey?: string): Promise<Booking> {
    return httpRequest(this.config, `/obp/v1/bookings/${id}/confirm`, {
      method: "POST",
      apiKey,
    });
  }

  cancel(id: string, reason?: string, apiKey?: string): Promise<Booking> {
    return httpRequest(this.config, `/obp/v1/bookings/${id}/cancel`, {
      method: "POST",
      body: reason ? { reason } : undefined,
      apiKey,
    });
  }

  complete(id: string, apiKey?: string): Promise<Booking> {
    return httpRequest(this.config, `/obp/v1/bookings/${id}/complete`, {
      method: "POST",
      apiKey,
    });
  }

  noShow(id: string, apiKey?: string): Promise<Booking> {
    return httpRequest(this.config, `/obp/v1/bookings/${id}/no-show`, {
      method: "POST",
      apiKey,
    });
  }
}
