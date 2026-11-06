import { describe, expect, it } from "vitest";
import { parseJson, prop } from "../json";
import { eventsRequest } from "../request";

describe("transport", () => {
  it("builds the POST request with bearer auth and the events envelope", () => {
    const event = { event: "sign_up", occurred_at: "2026-11-06T10:00:00.000Z", external_id: "1" };

    expect(eventsRequest("cev_x", [event], true)).toEqual({
      method: "POST",
      keepalive: true,
      headers: { Authorization: "Bearer cev_x", "Content-Type": "application/json" },
      body: JSON.stringify({ events: [event] }),
    });
  });

  it("reads JSON and properties without throwing", () => {
    expect(parseJson("{bad")).toBeNull();
    expect(parseJson(undefined)).toBeNull();
    expect(prop(parseJson('{"a":{"b":1}}'), "a")).toEqual({ b: 1 });
    expect(prop("text", "length")).toBeUndefined();
    expect(prop(null, "a")).toBeUndefined();
  });
});
