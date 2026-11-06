import { withDeps } from "@conty/core";
import { describe, expect, it } from "vitest";
import { toPayload } from "../payload";

const deps = withDeps({ clock: { now: () => 0 }, randomId: () => "id-1" });

describe("toPayload", () => {
  it("fills occurred_at and external_id and drops null fields", () => {
    expect(toPayload({ event: "sign_up", utm_content: null, value_cents: null }, deps)).toEqual({
      event: "sign_up",
      occurred_at: "1970-01-01T00:00:00.000Z",
      external_id: "id-1",
    });
  });

  it("treats an empty external_id as missing, like the browser and the app", () => {
    expect(toPayload({ event: "sign_up", external_id: "" }, deps).external_id).toBe("id-1");
  });

  it("keeps occurred_at text as is and converts a Date", () => {
    const text = toPayload({ event: "a", occurred_at: "2026-11-06T07:00:00-03:00" }, deps);
    const date = toPayload({ event: "a", occurred_at: new Date(0) }, deps);

    expect(text.occurred_at).toBe("2026-11-06T07:00:00-03:00");
    expect(date.occurred_at).toBe("1970-01-01T00:00:00.000Z");
  });
});
