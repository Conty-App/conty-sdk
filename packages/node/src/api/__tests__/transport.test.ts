import { describe, expect, it, vi } from "vitest";
import { apiError, CAMPAIGN_ID, call, IDEMPOTENCY, json, setup } from "./setup";

const timeout = () => new DOMException("The operation timed out.", "TimeoutError");

describe("public API transport", () => {
  it("returns invalid_response for a 2xx body that is not JSON, without retrying the write", async () => {
    const onError = vi.fn();
    const { conty, fetch } = setup(
      [new Response("<html>oops</html>", { status: 201, headers: { "X-Request-ID": "req_9" } })],
      { onError },
    );

    const { data, error } = await conty.missions.reinvite(CAMPAIGN_ID);

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: 201, code: "invalid_response", requestId: "req_9" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(call(fetch).headers.get("Idempotency-Key")).toBe(IDEMPOTENCY);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("returns invalid_response for an empty 2xx that is not 204", async () => {
    const { conty, fetch } = setup([new Response("", { status: 200 })]);

    const { data, error } = await conty.campaigns.get(CAMPAIGN_ID);

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: 200, code: "invalid_response" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("waits until the HTTP date in Retry-After", async () => {
    const { conty, fetch, delays } = setup([
      apiError(429, "rate_limited", { "Retry-After": "Wed, 11 Nov 2026 10:00:05 GMT" }),
      json({ id: CAMPAIGN_ID }),
    ]);

    const { error } = await conty.campaigns.get(CAMPAIGN_ID);

    expect(error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(delays).toEqual([5000]);
  });

  it("retries a GET that timed out and returns timeout after the last attempt", async () => {
    const { conty, fetch } = setup([timeout(), timeout(), timeout()]);

    const { data, error } = await conty.campaigns.get(CAMPAIGN_ID);

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: null, code: "timeout" });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("does not retry a write without Idempotency-Key when the network drops", async () => {
    const { conty, fetch } = setup([new TypeError("fetch failed"), json({ id: CAMPAIGN_ID })]);

    const { data, error } = await conty.campaigns.update(CAMPAIGN_ID, { budget_cents: 600_000 });

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: null, code: "network_error" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(call(fetch).headers.get("Idempotency-Key")).toBeNull();
  });
});
