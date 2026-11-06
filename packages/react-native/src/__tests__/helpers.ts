import { type Mock, vi } from "vitest";
import { createClient } from "../client/client";
import type { ContyStorage, LinkingSource, PlatformInfo } from "../client/types";

export const KEY = `cpk_c_${"A".repeat(43)}`;
export const SECRET_KEY = `cev_c_${"A".repeat(43)}`;
export const UUID = "00000000-0000-4000-8000-000000000001";
export const NOW = Date.parse("2026-11-06T10:00:00.000Z");
export const STORE = "conty_attribution";
export const DEEP_LINK =
  "minhaloja://produto/42?utm_source=conty&utm_medium=creator&utm_campaign=verao&utm_content=cr_abc12345#topo";

export type FetchMock = Mock<(url: string, init: RequestInit) => Promise<Response>>;

export interface StorageMock extends ContyStorage {
  items: Map<string, string>;
  getItem: Mock<ContyStorage["getItem"]>;
  setItem: Mock<ContyStorage["setItem"]>;
}

export interface LinkingMock extends LinkingSource {
  getInitialURL: Mock<() => Promise<string | null>>;
  addEventListener: Mock<LinkingSource["addEventListener"]>;
  open(url: string): void;
}

export function createLinking(initialUrl: string | null = null): LinkingMock {
  const listeners: Array<(event: { url: string }) => void> = [];
  return {
    getInitialURL: vi.fn(() => Promise.resolve(initialUrl)),
    addEventListener: vi.fn((_type, handler) => listeners.push(handler)),
    open: (url) => {
      for (const listener of listeners) listener({ url });
    },
  };
}

export function createStorage(saved?: unknown): StorageMock {
  const items = new Map<string, string>();
  if (saved !== undefined) items.set(STORE, JSON.stringify(saved));
  return {
    items,
    getItem: vi.fn(async (key) => items.get(key) ?? null),
    setItem: vi.fn(async (key, value) => {
      items.set(key, value);
    }),
  };
}

export const IOS: PlatformInfo = { OS: "ios", Version: "17.4" };

interface SetupOptions {
  storage?: StorageMock;
  platform?: PlatformInfo;
  maxWaitMs?: number;
}

export function setup(initialUrl: string | null = null, options: SetupOptions = {}) {
  const fetch: FetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 202 })));
  const linking = createLinking(initialUrl);
  const storage = options.storage ?? createStorage();
  const conty = createClient(
    {
      fetch,
      linking,
      storage,
      platform: options.platform ?? IOS,
      clock: { now: () => NOW },
      randomId: () => UUID,
    },
    options.maxWaitMs,
  );
  return { conty, fetch, linking, storage };
}

export function stored(storage: StorageMock) {
  return JSON.parse(storage.items.get(STORE) ?? "null");
}

export function sent(fetch: FetchMock, call = 0) {
  const [url, init] = fetch.mock.calls[call] ?? [];
  return { url, init, body: JSON.parse(String(init?.body)) };
}
