import type { Deps } from "./types";

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function withDeps(overrides: Partial<Deps> = {}): Deps {
  return {
    fetch: overrides.fetch || ((url, init) => fetch(url, init)),
    clock: overrides.clock || Date,
    randomId: overrides.randomId || randomId,
  };
}
