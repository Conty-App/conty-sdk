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

const { header } = PUBLIC_API;

function headersFor(apiKey: string, request: ApiRequest): Record<string, string> {
  const headers: Record<string, string> = {
    [header.authorization]: `Bearer ${apiKey}`,
    [header.accept]: request.accept ?? PUBLIC_API.jsonContent,
  };
  if (request.body !== undefined) headers[header.contentType] = PUBLIC_API.jsonContent;
  if (request.idempotencyKey) headers[header.idempotency] = request.idempotencyKey;
  return headers;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text().catch((cause: unknown) => {
    throw toContyError(cause, "network_error");
  });
  if (response.status === 204) return null;
  if (PUBLIC_API.textContent.test(response.headers.get(header.contentType) ?? "")) return text;
  const parsed = parseJson(text);
  if (parsed !== null) return parsed;
  throw new ContyError({
    status: response.status,
    code: "invalid_response",
    message: "Conty API returned a body that is not JSON.",
    requestId: response.headers.get(header.requestId),
  });
}

export function createTransport(config: TransportConfig): Transport {
  const { apiKey, baseUrl, maxRetries, timeoutMs, deps, sleep, onError } = config;

  async function send(
    url: string,
    init: RequestInit,
    retryable: boolean,
    retryServerErrors: boolean,
  ): Promise<unknown> {
    for (let attempt = 0; ; attempt++) {
      const last = !retryable || attempt >= maxRetries;
      const signal = AbortSignal.timeout(timeoutMs);
      const response = await deps.fetch(url, { ...init, signal }).catch((cause: unknown) => {
        if (last) throw toContyError(cause, "network_error");
        return null;
      });
      if (response?.ok) return readBody(response);
      const transient =
        response === null ||
        response.status === 429 ||
        (retryServerErrors && response.status >= 500);
      if (response && (last || !transient)) throw await errorFromResponse(response);
      await response?.body?.cancel().catch(() => undefined);
      const retryAfter = response?.headers.get(header.retryAfter) ?? null;
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
        const data = await send(url, init, retryable, request.method === "GET");
        return { data: data as T, error: null };
      } catch (cause) {
        const error = toContyError(cause, "unexpected_error");
        onError?.(error);
        return { data: null, error };
      }
    },
  };
}
