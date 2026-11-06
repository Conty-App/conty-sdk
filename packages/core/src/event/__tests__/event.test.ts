import { describe, expect, it } from "vitest";
import { BrandEventSchema } from "../../../../../test/fixtures/event-schema";
import { chunkEvents } from "../batch";
import { buildEvent, timestamp } from "../event";

const base = { context: {}, utm: {}, occurredAt: "2026-11-06T10:00:00.000Z", randomId: () => "id" };

describe("buildEvent", () => {
  it("moves reserved fields to the top level and the rest into properties", () => {
    const event = buildEvent({
      ...base,
      name: "purchase",
      props: { value_cents: 10.4, external_id: 9, link_code: " lk ", plan: "pro" },
      utm: { utm_source: "conty", utm_campaign: "verao" },
      context: { $os: "web", plan: "ignored" },
    });

    expect(BrandEventSchema.safeParse(event).success).toBe(true);
    expect(event).toEqual({
      event: "purchase",
      occurred_at: base.occurredAt,
      external_id: "9",
      value_cents: 10,
      link_code: "lk",
      utm_campaign: "verao",
      properties: { $os: "web", plan: "pro", utm_source: "conty" },
    });
  });

  it("generates external_id when missing or empty and omits empty properties", () => {
    expect(buildEvent({ ...base, name: "sign_up", props: { external_id: "" } })).toEqual({
      event: "sign_up",
      occurred_at: base.occurredAt,
      external_id: "id",
    });
  });

  it("formats the clock as ISO 8601", () => {
    expect(timestamp({ now: () => 0 })).toBe("1970-01-01T00:00:00.000Z");
  });
});

describe("chunkEvents", () => {
  it("caps each chunk at 100 events", () => {
    const sizes = chunkEvents(Array.from({ length: 201 }, (_, i) => i)).map((c) => c.length);

    expect(sizes).toEqual([100, 100, 1]);
  });

  it("caps each chunk below the message byte budget", () => {
    const big = "x".repeat(70_000);

    expect(chunkEvents([big, big, big]).map((c) => c.length)).toEqual([1, 1, 1]);
    expect(chunkEvents([])).toEqual([]);
  });
});
