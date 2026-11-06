import { type Mock, vi } from "vitest";
import type { WebPorts, WebStorage } from "../client/types";
import type { ScriptTag } from "../install/types";

export const KEY = `cpk_c_${"A".repeat(43)}`;
export const SECRET_KEY = `cev_c_${"A".repeat(43)}`;
export const UUID = "00000000-0000-4000-8000-000000000001";
export const NOW = Date.parse("2026-11-06T10:00:00.000Z");
export const STORE = "conty_attribution";

export type FetchMock = Mock<(url: string, init: RequestInit) => Promise<Response>>;

export interface Fakes extends WebPorts {
  fetch: FetchMock;
  warn: Mock<(message: string) => void>;
  items: Map<string, string>;
}

export function fakes(search = "", saved?: unknown): Fakes {
  const items = new Map<string, string>();
  if (saved !== undefined) items.set(STORE, JSON.stringify(saved));
  const storage: WebStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
  };
  return {
    fetch: vi.fn(() => Promise.resolve(new Response(null, { status: 202 }))),
    clock: { now: () => NOW },
    randomId: () => UUID,
    storage,
    location: { search },
    warn: vi.fn(),
    items,
  };
}

export function scriptTag(src: string, key?: string): ScriptTag {
  return { src, dataset: key ? { key } : {} };
}

export function sent(fetch: FetchMock, call = 0) {
  const [url, init] = fetch.mock.calls[call] ?? [];
  return { url, init, body: JSON.parse(String(init?.body)) };
}
