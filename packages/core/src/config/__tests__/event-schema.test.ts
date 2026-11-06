import { describe, expect, it } from "vitest";
import { BrandEventSchema } from "../../../../../test/fixtures/event-schema";
import { EVENT, UTM } from "../constants";

const base = { event: "purchase", occurred_at: "2026-11-06T10:00:00.000Z" };
const valid = (event: object) => BrandEventSchema.safeParse({ ...base, ...event }).success;

describe("event schema fixture", () => {
  it("accepts ISO 8601 with Z or an offset only", () => {
    expect(valid({ occurred_at: "2026-11-06T07:00:00-03:00" })).toBe(true);
    expect(valid({ occurred_at: "2026-11-06" })).toBe(false);
  });

  it("enforces the limits shared with the SDKs", () => {
    expect(valid({ event: "a".repeat(EVENT.name.max + 1) })).toBe(false);
    expect(valid({ value_cents: EVENT.valueCents.max + 1 })).toBe(false);
    expect(valid({ utm_campaign: "a".repeat(UTM.maxLength + 1) })).toBe(false);
    expect(valid({ link_code: "a".repeat(EVENT.linkCode.max + 1) })).toBe(false);
    expect(valid({ properties: { note: "x".repeat(EVENT.properties.maxBytes) } })).toBe(false);
  });

  it("rejects NUL in strings, keys and nested properties", () => {
    expect(valid({ external_id: "a\u0000" })).toBe(false);
    expect(valid({ properties: { "k\u0000": 1 } })).toBe(false);
    expect(valid({ properties: { a: { b: ["x\u0000"] } } })).toBe(false);
    expect(valid({ properties: { a: "\\u0000" } })).toBe(true);
  });
});
