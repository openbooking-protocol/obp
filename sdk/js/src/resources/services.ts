import { httpRequest } from "../http.js";
import type {
  OBPClientConfig,
  PaginatedResponse,
  Service,
  CreateServiceInput,
} from "../types.js";

type Config = Required<Pick<OBPClientConfig, "baseUrl" | "timeout" | "maxRetries">> & Pick<OBPClientConfig, "apiKey" | "token" | "fetch">;

export class ServicesResource {
  constructor(private readonly config: Config) {}

  list(params?: {
    provider_id?: string;
    category?: string;
    active?: boolean;
    search?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<Service>> {
    return httpRequest(this.config, "/obp/v1/services", { params });
  }

  get(id: string): Promise<Service> {
    return httpRequest(this.config, `/obp/v1/services/${id}`);
  }

  create(input: CreateServiceInput, apiKey?: string): Promise<Service> {
    return httpRequest(this.config, "/obp/v1/services", {
      method: "POST",
      body: input,
      apiKey,
    });
  }

  update(id: string, input: Partial<CreateServiceInput>, apiKey?: string): Promise<Service> {
    return httpRequest(this.config, `/obp/v1/services/${id}`, {
      method: "PUT",
      body: input,
      apiKey,
    });
  }

  delete(id: string, apiKey?: string): Promise<void> {
    return httpRequest(this.config, `/obp/v1/services/${id}`, {
      method: "DELETE",
      apiKey,
    });
  }
}
