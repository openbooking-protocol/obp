import { httpRequest } from "../http.js";
import type {
  OBPClientConfig,
  PaginatedResponse,
  Slot,
  HoldSlotResponse,
} from "../types.js";

type Config = Required<Pick<OBPClientConfig, "baseUrl" | "timeout" | "maxRetries">> & Pick<OBPClientConfig, "apiKey" | "token" | "fetch">;

export class SlotsResource {
  constructor(private readonly config: Config) {}

  list(params: {
    service_id: string;
    date_from: string;
    date_to: string;
    resource_id?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<Slot>> {
    return httpRequest(this.config, "/obp/v1/slots", { params });
  }

  get(id: string): Promise<Slot> {
    return httpRequest(this.config, `/obp/v1/slots/${id}`);
  }

  hold(id: string): Promise<HoldSlotResponse> {
    return httpRequest(this.config, `/obp/v1/slots/${id}/hold`, {
      method: "POST",
    });
  }
}
