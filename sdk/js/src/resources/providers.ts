import { httpRequest } from "../http.js";
import type {
  OBPClientConfig,
  PaginatedResponse,
  Provider,
  CreateProviderInput,
} from "../types.js";

type Config = Required<Pick<OBPClientConfig, "baseUrl" | "timeout" | "maxRetries">> & Pick<OBPClientConfig, "apiKey" | "token" | "fetch">;

export class ProvidersResource {
  constructor(private readonly config: Config) {}

  list(params?: {
    status?: string;
    category?: string;
    search?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<Provider>> {
    return httpRequest(this.config, "/obp/v1/providers", { params });
  }

  get(id: string): Promise<Provider> {
    return httpRequest(this.config, `/obp/v1/providers/${id}`);
  }

  create(input: CreateProviderInput, apiKey?: string): Promise<Provider> {
    return httpRequest(this.config, "/obp/v1/providers", {
      method: "POST",
      body: input,
      apiKey,
    });
  }

  update(id: string, input: Partial<CreateProviderInput>, apiKey?: string): Promise<Provider> {
    return httpRequest(this.config, `/obp/v1/providers/${id}`, {
      method: "PUT",
      body: input,
      apiKey,
    });
  }

  categories(): Promise<string[]> {
    return httpRequest(this.config, "/obp/v1/categories");
  }
}
