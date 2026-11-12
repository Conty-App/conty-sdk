import { describe, expect, it } from "vitest";
import type { ContyApi } from "../../index";
import { apiError, BASE, CAMPAIGN_ID, call, IDEMPOTENCY, json, setup } from "./setup";

const APPLICATION_ID = "0f4b8d2c-6a1e-4c3f-9b5d-2e7a4c1f8b63";
const CREATOR_ID = "9d3f1b7c-5e2a-4c8d-a6b1-2f3e4d5c6b7a";
const APPLICATION = `${BASE}/campaigns/${CAMPAIGN_ID}/applications/${APPLICATION_ID}`;
const CREATOR = `${BASE}/campaigns/${CAMPAIGN_ID}/creators/${CREATOR_ID}`;

interface Case {
  name: string;
  run: (conty: ContyApi) => Promise<unknown>;
  method: string;
  url: string;
  body: unknown;
  key: string | null;
}

const CASES: Case[] = [
  {
    name: "applications.approve",
    run: (conty) =>
      conty.applications.approve(CAMPAIGN_ID, APPLICATION_ID, { scope_option_id: "s1" }),
    method: "POST",
    url: `${APPLICATION}/approve`,
    body: { scope_option_id: "s1" },
    key: null,
  },
  {
    name: "applications.reject",
    run: (conty) => conty.applications.reject(CAMPAIGN_ID, APPLICATION_ID),
    method: "POST",
    url: `${APPLICATION}/reject`,
    body: undefined,
    key: null,
  },
  {
    name: "applications.restore",
    run: (conty) =>
      conty.applications.restore(CAMPAIGN_ID, APPLICATION_ID, { destination: "interested" }),
    method: "POST",
    url: `${APPLICATION}/restore`,
    body: { destination: "interested" },
    key: null,
  },
  {
    name: "applications.bulk",
    run: (conty) =>
      conty.applications.bulk(CAMPAIGN_ID, { action: "approve", application_ids: ["a1"] }),
    method: "POST",
    url: `${BASE}/campaigns/${CAMPAIGN_ID}/applications/bulk`,
    body: { action: "approve", application_ids: ["a1"] },
    key: IDEMPOTENCY,
  },
  {
    name: "applications.setProposedDeadline",
    run: (conty) =>
      conty.applications.setProposedDeadline(CAMPAIGN_ID, APPLICATION_ID, {
        delivery_date: "2026-12-10T23:59:00-03:00",
      }),
    method: "PATCH",
    url: `${APPLICATION}/proposed-deadline`,
    body: { delivery_date: "2026-12-10T23:59:00-03:00" },
    key: null,
  },
  {
    name: "applications.setProposedAmount",
    run: (conty) =>
      conty.applications.setProposedAmount(CAMPAIGN_ID, APPLICATION_ID, { amount_cents: 80_000 }),
    method: "PATCH",
    url: `${APPLICATION}/proposed-amount`,
    body: { amount_cents: 80_000 },
    key: null,
  },
  {
    name: "campaigns.creators.setScopeOption",
    run: (conty) =>
      conty.campaigns.creators.setScopeOption(CAMPAIGN_ID, CREATOR_ID, { scope_option_id: "s1" }),
    method: "PATCH",
    url: `${CREATOR}/scope-option`,
    body: { scope_option_id: "s1" },
    key: null,
  },
  {
    name: "campaigns.creators.setBriefing",
    run: (conty) =>
      conty.campaigns.creators.setBriefing(CAMPAIGN_ID, CREATOR_ID, { briefing_id: "b1" }),
    method: "PATCH",
    url: `${CREATOR}/briefing`,
    body: { briefing_id: "b1" },
    key: null,
  },
  {
    name: "campaigns.creators.setScopeAmount",
    run: (conty) =>
      conty.campaigns.creators.setScopeAmount(CAMPAIGN_ID, CREATOR_ID, { amount_cents: 90_000 }),
    method: "PATCH",
    url: `${CREATOR}/scope-amount`,
    body: { amount_cents: 90_000 },
    key: null,
  },
  {
    name: "campaigns.creators.bulkExclude",
    run: (conty) => conty.campaigns.creators.bulkExclude(CAMPAIGN_ID, { creator_ids: ["c1"] }),
    method: "POST",
    url: `${BASE}/campaigns/${CAMPAIGN_ID}/creators/bulk/exclude`,
    body: { creator_ids: ["c1"] },
    key: IDEMPOTENCY,
  },
];

describe("applications and campaign creators requests", () => {
  for (const { name, run, method, url, body, key } of CASES) {
    it(`${name} sends ${method} to its route`, async () => {
      const { conty, fetch } = setup([json({ ok: true })]);

      const result = await run(conty);

      expect(result).toEqual({ data: { ok: true }, error: null });
      const sent = call(fetch);
      expect(sent.init?.method).toBe(method);
      expect(sent.url).toBe(url);
      expect(sent.body).toEqual(body);
      expect(sent.headers.get("Idempotency-Key")).toBe(key);
    });
  }
});

describe("applications", () => {
  it("passes the caller key on an optional route", async () => {
    const { conty, fetch } = setup([json({ id: APPLICATION_ID })]);

    await conty.applications.approve(CAMPAIGN_ID, APPLICATION_ID, undefined, {
      idempotencyKey: "approve-1",
    });

    expect(call(fetch).headers.get("Idempotency-Key")).toBe("approve-1");
    expect(call(fetch).headers.get("Content-Type")).toBeNull();
  });

  it("returns the job of a bulk approve and the result of a bulk reject", async () => {
    const job = { job_id: "j1", total: 2 };
    const rejected = { succeeded_ids: ["a1"], failed: [] };
    const { conty } = setup([json(job, 202), json(rejected)]);

    const approve = await conty.applications.bulk(CAMPAIGN_ID, {
      action: "approve",
      application_ids: ["a1", "a2"],
    });
    const reject = await conty.applications.bulk(CAMPAIGN_ID, {
      action: "reject",
      application_ids: ["a1"],
      reason: "Fora do perfil",
    });

    expect(approve.data).toEqual(job);
    expect(reject.data).toEqual(rejected);
  });

  it("does not retry a 409 invalid_transition even with Idempotency-Key", async () => {
    const details = { status: "approved" };
    const { conty, fetch } = setup([apiError(409, "invalid_transition", {}, details)]);

    const { error } = await conty.applications.reject(CAMPAIGN_ID, APPLICATION_ID, undefined, {
      idempotencyKey: "reject-1",
    });

    expect(error).toMatchObject({ status: 409, code: "invalid_transition", details });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns the required scope on 403 insufficient_scope", async () => {
    const details = [{ required_scope: "campaigns:spend" }];
    const { conty, fetch } = setup([apiError(403, "insufficient_scope", {}, details)]);

    const { data, error } = await conty.campaigns.creators.setScopeAmount(CAMPAIGN_ID, CREATOR_ID, {
      amount_cents: 90_000,
    });

    expect(data).toBeNull();
    expect(error?.code).toBe("insufficient_scope");
    const [detail] = (error?.details ?? []) as { required_scope: string }[];
    expect(detail?.required_scope).toBe("campaigns:spend");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries a bulk exclude after a 429 with the same generated key", async () => {
    const { conty, fetch } = setup([apiError(429, "rate_limited"), json({ job_id: "j1" }, 202)]);

    const { error } = await conty.campaigns.creators.bulkExclude(CAMPAIGN_ID, {
      creator_ids: ["c1"],
    });

    expect(error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(call(fetch, 1).headers.get("Idempotency-Key")).toBe(IDEMPOTENCY);
  });
});
