import { ProvidersResource } from "./resources/providers.js";
import { ServicesResource } from "./resources/services.js";
import { SlotsResource } from "./resources/slots.js";
import { BookingsResource } from "./resources/bookings.js";
import { httpRequest } from "./http.js";
import type { OBPClientConfig, WellKnownObp } from "./types.js";

export class OBPClient {
  private readonly _config: Required<Pick<OBPClientConfig, "baseUrl" | "timeout" | "maxRetries">> &
    Pick<OBPClientConfig, "apiKey" | "token" | "fetch">;

  public readonly providers: ProvidersResource;
  public readonly services: ServicesResource;
  public readonly slots: SlotsResource;
  public readonly bookings: BookingsResource;

  constructor(config: OBPClientConfig) {
    if (!config.baseUrl) throw new Error("baseUrl is required");

    this._config = {
      baseUrl: config.baseUrl.replace(/\/$/, ""),
      apiKey: config.apiKey,
      token: config.token,
      timeout: config.timeout ?? 30_000,
      maxRetries: config.maxRetries ?? 3,
      fetch: config.fetch,
    };

    this.providers = new ProvidersResource(this._config);
    this.services = new ServicesResource(this._config);
    this.slots = new SlotsResource(this._config);
    this.bookings = new BookingsResource(this._config);
  }

  /**
   * Discover server capabilities via /.well-known/obp
   */
  discover(): Promise<WellKnownObp> {
    return httpRequest(this._config, "/.well-known/obp");
  }

  /**
   * Return a calendar (.ics) URL for a booking
   */
  bookingCalendarUrl(bookingId: string): string {
    return `${this._config.baseUrl}/bookings/${bookingId}/calendar.ics`;
  }

  /**
   * Return a calendar (.ics) URL for all bookings of a provider
   */
  providerCalendarUrl(providerId: string): string {
    return `${this._config.baseUrl}/providers/${providerId}/calendar.ics`;
  }

  /**
   * Create a new client instance with updated config (e.g. new API key)
   */
  withConfig(updates: Partial<OBPClientConfig>): OBPClient {
    return new OBPClient({ ...this._config, ...updates });
  }
}
