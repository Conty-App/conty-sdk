import { type Deps, parseJson } from "@conty/core";
import { ContyError, errorFromResponse, toContyError } from "../errors/errors";
import { retryDelayMs } from "../transport/retry";
import type { Sleep } from "../transport/types";
import { PUBLIC_API } from "./constants";
import type { ApiRequest, Transport } from "./types";
import { buildUrl } from "./url";

export interface TransportConfig {
  apiKey: string;
  baseUrl: string;
  maxRetries: number;
  timeoutMs: number;
  deps: Deps;
  sleep: Sleep;
  onError?: (error: ContyError) => void;
}

function headersFor(apiKey: string, request: ApiRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: request.accept ?? "application/json",
  };
  if (request.body !== undefined) headers["Content-Type"] = "application/json";
  if (request.idempotencyKey) headers[PUBLIC_API.header.idempotency] = request.idempotencyKey;
  return headers;
}

async function readBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (response.status === 204) return null as T;
  if (PUBLIC_API.textContent.test(response.headers.get("Content-Type") ?? "")) return text as T;
  const parsed = parseJson(text);
  if (parsed === null) {
    throw new ContyError({
      status: response.status,
      code: "invalid_response",
      message: "Conty API returned a body that is not JSON.",
      requestId: response.headers.get(PUBLIC_API.header.requestId),
    });
  }
  return parsed as T;
}

export function createTransport(config: TransportConfig): Transport {
  const { apiKey, baseUrl, maxRetries, timeoutMs, deps, sleep, onError } = config;

  async function send<T>(
    url: string,
    init: RequestInit,
    retryable: boolean,
    retryServerErrors: boolean,
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const last = !retryable || attempt >= maxRetries;
      const signal = AbortSignal.timeout(timeoutMs);
      const response = await deps.fetch(url, { ...init, signal }).catch((cause: unknown) => {
        if (last) throw toContyError(cause, "network_error");
        return null;
      });
      if (response?.ok) return readBody<T>(response);
      const transient =
        response === null ||
        response.status === 429 ||
        (retryServerErrors && response.status >= 500);
      if (response && (last || !transient)) throw await errorFromResponse(response);
      await response?.body?.cancel().catch(() => undefined);
      const retryAfter = response?.headers.get("Retry-After") ?? null;
      await sleep(retryDelayMs(attempt, retryAfter, deps.clock.now()));
    }
  }

  return {
    async request<T>(request: ApiRequest) {
      const url = buildUrl(baseUrl, request.path, request.query);
      const init: RequestInit = {
        method: request.method,
        headers: headersFor(apiKey, request),
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
      };
      const retryable = request.method === "GET" || Boolean(request.idempotencyKey);
      try {
        return {
          data: await send<T>(url, init, retryable, request.method === "GET"),
          error: null,
        };
      } catch (cause) {
        const error = toContyError(cause, "unexpected_error");
        onError?.(error);
        return { data: null, error };
      }
    },
  };
}
