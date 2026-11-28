import { type Mock, vi } from "vitest";
import { type ContyApiOptions, createContyApi } from "../../index";

export const API_KEY = `ck_live_${"a".repeat(32)}`;
export const CAMPAIGN_ID = "6c1e8f2a-3b4d-4a5c-9e7f-0a1b2c3d4e5f";
export const IDEMPOTENCY = "00000000-0000-4000-8000-000000000001";
const NOW = Date.parse("2026-11-11T10:00:00.000Z");
export const BASE = "https://api.appconty.com/public/v1";

type FetchMock = Mock<(url: string, init: RequestInit) => Promise<Response>>;

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

export function apiError(
  status: number,
  code: string,
  headers: Record<string, string> = {},
  details?: unknown,
) {
  return json({ error: { code, message: code, request_id: "req_1", details } }, status, headers);
}

export function setup(responses: Array<Response | Error>, options: Partial<ContyApiOptions> = {}) {
  const fetch: FetchMock = vi.fn();
  for (const response of responses) {
    if (response instanceof Error) fetch.mockRejectedValueOnce(response);
    else fetch.mockResolvedValueOnce(response);
  }
  const delays: number[] = [];
  const conty = createContyApi({
    apiKey: API_KEY,
    fetch,
    clock: { now: () => NOW },
    randomId: () => IDEMPOTENCY,
    sleep: async (ms) => {
      delays.push(ms);
    },
    ...options,
  });
  return { conty, fetch, delays };
}

export function call(fetch: FetchMock, index = 0) {
  const [url, init] = fetch.mock.calls[index] ?? [];
  const headers = new Headers(init?.headers);
  return { url, init, headers, body: init?.body ? JSON.parse(String(init.body)) : undefined };
}
