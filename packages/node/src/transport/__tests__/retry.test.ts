import { describe, expect, it } from "vitest";
import { retryDelayMs } from "../retry";

const NOW = Date.parse("2026-11-06T10:00:00Z");
const half = () => 0.5;

describe("retryDelayMs", () => {
  it("uses Retry-After in seconds or as an HTTP date, capped at 120 s, without jitter", () => {
    expect(retryDelayMs(0, "2", NOW, half)).toBe(2_000);
    expect(retryDelayMs(0, "Fri, 06 Nov 2026 10:00:05 GMT", NOW, half)).toBe(5_000);
    expect(retryDelayMs(0, "60", NOW, half)).toBe(60_000);
    expect(retryDelayMs(0, "3600", NOW, half)).toBe(120_000);
  });

  it("falls back to exponential backoff with full jitter without Retry-After", () => {
    expect([0, 1, 2].map((attempt) => retryDelayMs(attempt, null, NOW, half))).toEqual([
      250, 500, 1_000,
    ]);
    expect(retryDelayMs(2, null, NOW, () => 0)).toBe(0);
    expect(retryDelayMs(20, null, NOW, () => 0.999)).toBeLessThanOrEqual(30_000);
  });

  it("ignores an unreadable Retry-After", () => {
    expect(retryDelayMs(1, "soon", NOW, half)).toBe(500);
  });
});
