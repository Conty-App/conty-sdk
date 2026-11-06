import { RETRY } from "@conty/core";
import type { Random, Sleep } from "./types";

export const sleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function retryAfterMs(retryAfter: string | null, now: number): number | null {
  const seconds = Number(retryAfter || Number.NaN);
  if (seconds >= 0) return seconds * 1000;
  const date = Date.parse(retryAfter ?? "");
  return Number.isNaN(date) ? null : date - now;
}

export function retryDelayMs(
  attempt: number,
  retryAfter: string | null,
  now: number,
  random: Random = Math.random,
): number {
  const fromHeader = retryAfterMs(retryAfter, now);
  if (fromHeader !== null) return Math.min(Math.max(fromHeader, 0), RETRY.maxRetryAfterMs);
  const ceiling = Math.min(RETRY.baseDelayMs * 2 ** attempt, RETRY.maxDelayMs);
  return Math.floor(random() * ceiling);
}
