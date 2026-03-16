import { OBPError, NetworkError, TimeoutError } from "./error.js";
import type { OBPClientConfig } from "./types.js";

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  apiKey?: string;
  token?: string;
  signal?: AbortSignal;
}

const RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export async function httpRequest<T>(
  config: Required<Pick<OBPClientConfig, "baseUrl" | "timeout" | "maxRetries">> & Pick<OBPClientConfig, "apiKey" | "token" | "fetch">,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params, apiKey, token } = options;
  const fetchFn = config.fetch ?? globalThis.fetch;

  const url = new URL(`${config.baseUrl}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value != null) url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const effectiveApiKey = apiKey ?? config.apiKey;
  const effectiveToken = token ?? config.token;
  if (effectiveApiKey) headers["X-Api-Key"] = effectiveApiKey;
  if (effectiveToken) headers["Authorization"] = `Bearer ${effectiveToken}`;

  let attempt = 0;
  while (true) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeout);

    try {
      const res = await fetchFn(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 204) return undefined as T;

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const problem = {
          type: data.type ?? `https://obp.dev/errors/http-${res.status}`,
          title: data.title ?? res.statusText,
          status: res.status,
          detail: data.detail,
          instance: data.instance,
        };

        // Retry on transient errors
        if (RETRY_STATUS.has(res.status) && attempt < config.maxRetries) {
          const retryAfter = res.headers.get("Retry-After");
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(1000 * 2 ** (attempt - 1), 10000);
          await sleep(delay);
          continue;
        }

        throw new OBPError(problem);
      }

      return data as T;
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof OBPError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new TimeoutError(config.timeout);
      }
      if (attempt < config.maxRetries) {
        await sleep(Math.min(1000 * 2 ** (attempt - 1), 10000));
        continue;
      }
      throw new NetworkError(`Network error: ${String(err)}`, err);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
