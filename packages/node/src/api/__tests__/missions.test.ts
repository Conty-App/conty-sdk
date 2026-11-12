import { describe, expect, it } from "vitest";
import type { ContyApi } from "../../index";
import { apiError, BASE, CAMPAIGN_ID, call, IDEMPOTENCY, json, setup } from "./setup";

const MISSION_ID = "2b9e4d7a-1c3f-4e5a-8b6d-9f0a1c2e3d4b";
const MISSION = `${BASE}/missions/${MISSION_ID}`;
const DATES = { delivery_date: "2026-12-10T23:59:00-03:00" };

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
    name: "missions.get",
    run: (conty) => conty.missions.get(MISSION_ID),
    method: "GET",
    url: MISSION,
    body: undefined,
    key: null,
  },
  {
    name: "missions.approve",
    run: (conty) => conty.missions.approve(MISSION_ID, { rating: 5 }),
    method: "POST",
    url: `${MISSION}/approve`,
    body: { rating: 5 },
    key: null,
  },
  {
    name: "missions.requestChanges",
    run: (conty) => conty.missions.requestChanges(MISSION_ID, { feedback: "Mostre o produto." }),
    method: "POST",
    url: `${MISSION}/request-changes`,
    body: { feedback: "Mostre o produto." },
    key: null,
  },
  {
    name: "missions.reject",
    run: (conty) => conty.missions.reject(MISSION_ID, { reason: "Fora do briefing combinado." }),
    method: "POST",
    url: `${MISSION}/reject`,
    body: { reason: "Fora do briefing combinado." },
    key: null,
  },
  {
    name: "missions.reviewAsset",
    run: (conty) => conty.missions.reviewAsset(MISSION_ID, "script", { decision: "approved" }),
    method: "POST",
    url: `${MISSION}/assets/script/review`,
    body: { decision: "approved" },
    key: null,
  },
  {
    name: "missions.setAssetVersion",
    run: (conty) => conty.missions.setAssetVersion(MISSION_ID, { version_id: "v1" }),
    method: "PATCH",
    url: `${MISSION}/asset-version`,
    body: { version_id: "v1" },
    key: null,
  },
  {
    name: "missions.setDeadline",
    run: (conty) => conty.missions.setDeadline(MISSION_ID, DATES),
    method: "PATCH",
    url: `${MISSION}/deadline`,
    body: DATES,
    key: null,
  },
  {
    name: "missions.send",
    run: (conty) => conty.missions.send(MISSION_ID, { briefing_id: "b1" }),
    method: "POST",
    url: `${MISSION}/send`,
    body: { briefing_id: "b1" },
    key: null,
  },
  {
    name: "missions.restore",
    run: (conty) => conty.missions.restore(MISSION_ID),
    method: "POST",
    url: `${MISSION}/restore`,
    body: undefined,
    key: null,
  },
  {
    name: "missions.reinviteEligibility",
    run: (conty) => conty.missions.reinviteEligibility(MISSION_ID),
    method: "GET",
    url: `${MISSION}/reinvite-eligibility`,
    body: undefined,
    key: null,
  },
  {
    name: "missions.reinvite",
    run: (conty) => conty.missions.reinvite(MISSION_ID, DATES),
    method: "POST",
    url: `${MISSION}/reinvite`,
    body: DATES,
    key: IDEMPOTENCY,
  },
  {
    name: "missions.approvePending",
    run: (conty) =>
      conty.missions.approvePending({ missions: [{ mission_id: "m1", targets: ["delivery"] }] }),
    method: "POST",
    url: `${BASE}/missions/approve-pending`,
    body: { missions: [{ mission_id: "m1", targets: ["delivery"] }] },
    key: IDEMPOTENCY,
  },
  {
    name: "missions.bulkStatus",
    run: (conty) =>
      conty.missions.bulkStatus(CAMPAIGN_ID, {
        status: "changes_requested",
        mission_ids: ["m1"],
        feedback: "Mostre o produto.",
      }),
    method: "POST",
    url: `${BASE}/campaigns/${CAMPAIGN_ID}/missions/bulk-status`,
    body: { status: "changes_requested", mission_ids: ["m1"], feedback: "Mostre o produto." },
    key: null,
  },
  {
    name: "missions.bulkDeadline",
    run: (conty) => conty.missions.bulkDeadline({ mission_ids: ["m1"], ...DATES }),
    method: "POST",
    url: `${BASE}/missions/bulk/deadline`,
    body: { mission_ids: ["m1"], ...DATES },
    key: IDEMPOTENCY,
  },
  {
    name: "missions.bulkSend",
    run: (conty) => conty.missions.bulkSend({ mission_ids: ["m1"] }),
    method: "POST",
    url: `${BASE}/missions/bulk/send`,
    body: { mission_ids: ["m1"] },
    key: IDEMPOTENCY,
  },
  {
    name: "missions.bulkRemove",
    run: (conty) => conty.missions.bulkRemove({ mission_ids: ["m1"] }),
    method: "POST",
    url: `${BASE}/missions/bulk/remove`,
    body: { mission_ids: ["m1"] },
    key: IDEMPOTENCY,
  },
  {
    name: "missionCombos.setStatus",
    run: (conty) => conty.missionCombos.setStatus("combo-1", { status: "approved", rating: 5 }),
    method: "POST",
    url: `${BASE}/mission-combos/combo-1/status`,
    body: { status: "approved", rating: 5 },
    key: null,
  },
];

describe("missions requests", () => {
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

describe("missions", () => {
  it("removes with DELETE and returns null data on 204", async () => {
    const { conty, fetch } = setup([new Response(null, { status: 204 })]);

    const result = await conty.missions.remove(MISSION_ID);

    expect(result).toEqual({ data: null, error: null });
    expect(call(fetch).init?.method).toBe("DELETE");
    expect(call(fetch).url).toBe(MISSION);
    expect(call(fetch).headers.get("Idempotency-Key")).toBeNull();
  });

  it("does not retry a 409 invalid_transition on an asset review with Idempotency-Key", async () => {
    const details = { asset: "cover", status: "approved" };
    const { conty, fetch } = setup([apiError(409, "invalid_transition", {}, details)]);

    const { error } = await conty.missions.reviewAsset(
      MISSION_ID,
      "cover",
      { decision: "approved" },
      { idempotencyKey: "cover-1" },
    );

    expect(error).toMatchObject({ status: 409, code: "invalid_transition", details });
    expect(call(fetch).headers.get("Idempotency-Key")).toBe("cover-1");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns the required scope on 403 insufficient_scope", async () => {
    const details = [{ required_scope: "campaigns:spend" }];
    const { conty, fetch } = setup([apiError(403, "insufficient_scope", {}, details)]);

    const { error } = await conty.missions.reinvite(MISSION_ID);

    expect(error?.status).toBe(403);
    const [detail] = (error?.details ?? []) as { required_scope: string }[];
    expect(detail?.required_scope).toBe("campaigns:spend");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry an optional route sent without Idempotency-Key", async () => {
    const { conty, fetch } = setup([apiError(503, "internal_error")]);

    const { error } = await conty.missions.approve(MISSION_ID);

    expect(error?.status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries a bulk route after a 503 keeping the caller key", async () => {
    const { conty, fetch } = setup([apiError(503, "internal_error"), json({ job_id: "j1" }, 202)]);

    const { error } = await conty.missions.bulkRemove(
      { mission_ids: ["m1"] },
      { idempotencyKey: "remove-1" },
    );

    expect(error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(call(fetch, 1).headers.get("Idempotency-Key")).toBe("remove-1");
  });
});
