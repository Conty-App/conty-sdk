import { RETRY } from "@conty/core";

export function clampRetries(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return RETRY.maxRetries;
  return Math.min(RETRY.maxRetriesLimit, Math.max(0, Math.trunc(value)));
}

export function positiveMs(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}
