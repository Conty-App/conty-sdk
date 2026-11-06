import type { Compact } from "./types";

export function compact<T extends object>(value: T): Compact<T> {
  const result: Compact<T> = {};
  for (const key in value) {
    const item = value[key];
    if (item != null) result[key] = item;
  }
  return result;
}
