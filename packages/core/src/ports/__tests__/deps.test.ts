import { describe, expect, it } from "vitest";
import { withDeps } from "../deps";

describe("withDeps", () => {
  it("keeps injected ports", () => {
    const fetch = () => Promise.resolve(new Response());
    const clock = { now: () => 1 };
    const randomId = () => "id";

    expect(withDeps({ fetch, clock, randomId })).toEqual({ fetch, clock, randomId });
  });

  it("defaults to the system clock and a UUID", () => {
    const deps = withDeps();

    expect(deps.clock).toBe(Date);
    expect(deps.randomId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4/);
    expect(typeof deps.fetch).toBe("function");
  });
});
