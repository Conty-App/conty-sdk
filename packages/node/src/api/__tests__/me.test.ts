import { describe, expect, it } from "vitest";
import { API_KEY, apiError, BASE, call, json, setup } from "./setup";

describe("me.get", () => {
  it("returns the brand, the key scopes and the campaign model", async () => {
    const me = {
      enterprise: { id: "e1", name: "Marca Exemplo" },
      api_key: {
        id: "k1",
        name: "ERP",
        hint: "a9Xk",
        scopes: ["campaigns:write"],
        ads_daily_budget_cap_cents: null,
      },
      campaign_model: "agreement",
    };
    const { conty, fetch } = setup([json(me)]);

    const { data } = await conty.me.get();

    expect(data).toEqual(me);
    const { url, init, headers } = call(fetch);
    expect(url).toBe(`${BASE}/me`);
    expect(init?.method).toBe("GET");
    expect(headers.get("Authorization")).toBe(`Bearer ${API_KEY}`);
    expect(headers.get("Idempotency-Key")).toBeNull();
  });

  it("returns a 403 with its details without retrying", async () => {
    const details = { plan: null };
    const { conty, fetch } = setup([apiError(403, "plan_required", {}, details)]);

    const { data, error } = await conty.me.get();

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: 403, code: "plan_required", details });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
