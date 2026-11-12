import { describe, expect, it } from "vitest";
import type { ContyApi } from "../../index";
import { apiError, BASE, CAMPAIGN_ID, call, IDEMPOTENCY, json, setup } from "./setup";

const CAMPAIGN = `${BASE}/campaigns/${CAMPAIGN_ID}`;
const CREATOR_ID = "9d3f1b7c-5e2a-4c8d-a6b1-2f3e4d5c6b7a";

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
    name: "campaigns.coupons.pool.list",
    run: (conty) => conty.campaigns.coupons.pool.list(CAMPAIGN_ID, { q: "VERAO", limit: 10 }),
    method: "GET",
    url: `${CAMPAIGN}/coupon-pool?q=VERAO&limit=10`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.coupons.pool.add",
    run: (conty) => conty.campaigns.coupons.pool.add(CAMPAIGN_ID, { codes: ["VERAO10"] }),
    method: "POST",
    url: `${CAMPAIGN}/coupon-pool`,
    body: { codes: ["VERAO10"] },
    key: IDEMPOTENCY,
  },
  {
    name: "campaigns.coupons.bulk",
    run: (conty) =>
      conty.campaigns.coupons.bulk(CAMPAIGN_ID, { mode: "pool", creator_ids: [CREATOR_ID] }),
    method: "POST",
    url: `${CAMPAIGN}/coupons/bulk`,
    body: { mode: "pool", creator_ids: [CREATOR_ID] },
    key: IDEMPOTENCY,
  },
  {
    name: "campaigns.coupons.setCommissionBudget",
    run: (conty) =>
      conty.campaigns.coupons.setCommissionBudget(CAMPAIGN_ID, { amount_cents: 100_000 }),
    method: "POST",
    url: `${CAMPAIGN}/coupon-commission/budget`,
    body: { amount_cents: 100_000 },
    key: IDEMPOTENCY,
  },
  {
    name: "campaigns.coupons.sales",
    run: (conty) => conty.campaigns.coupons.sales(CAMPAIGN_ID, { status: "active" }),
    method: "GET",
    url: `${CAMPAIGN}/coupon-sales?status=active`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.results.overview",
    run: (conty) => conty.campaigns.results.overview(CAMPAIGN_ID, { posted_from: "2026-11-01" }),
    method: "GET",
    url: `${CAMPAIGN}/results?posted_from=2026-11-01`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.results.timeseries",
    run: (conty) => conty.campaigns.results.timeseries(CAMPAIGN_ID),
    method: "GET",
    url: `${CAMPAIGN}/results/timeseries`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.results.creators",
    run: (conty) => conty.campaigns.results.creators(CAMPAIGN_ID, { sort: "views", limit: 5 }),
    method: "GET",
    url: `${CAMPAIGN}/results/creators?sort=views&limit=5`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.results.deliveries",
    run: (conty) => conty.campaigns.results.deliveries(CAMPAIGN_ID, CREATOR_ID),
    method: "GET",
    url: `${CAMPAIGN}/results/creators/${CREATOR_ID}/deliveries`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.results.traffic",
    run: (conty) => conty.campaigns.results.traffic(CAMPAIGN_ID),
    method: "GET",
    url: `${CAMPAIGN}/results/traffic`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.results.trafficEvents",
    run: (conty) => conty.campaigns.results.trafficEvents(CAMPAIGN_ID, { q: "purchase" }),
    method: "GET",
    url: `${CAMPAIGN}/results/traffic/events?q=purchase`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.counts",
    run: (conty) => conty.campaigns.counts(CAMPAIGN_ID),
    method: "GET",
    url: `${CAMPAIGN}/counts`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.segments",
    run: (conty) => conty.campaigns.segments(CAMPAIGN_ID, { group_by: "list" }),
    method: "GET",
    url: `${CAMPAIGN}/segments?group_by=list`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.suggestions",
    run: (conty) => conty.campaigns.suggestions(CAMPAIGN_ID, { only_compatible: true }),
    method: "GET",
    url: `${CAMPAIGN}/suggestions?only_compatible=true`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.aiRubric.get",
    run: (conty) => conty.campaigns.aiRubric.get(CAMPAIGN_ID),
    method: "GET",
    url: `${CAMPAIGN}/ai-rubric`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.aiRubric.set",
    run: (conty) => conty.campaigns.aiRubric.set(CAMPAIGN_ID, { block_id: "b1" }),
    method: "PUT",
    url: `${CAMPAIGN}/ai-rubric`,
    body: { block_id: "b1" },
    key: null,
  },
  {
    name: "campaigns.tracking",
    run: (conty) => conty.campaigns.tracking(CAMPAIGN_ID, { limit: 20 }),
    method: "GET",
    url: `${CAMPAIGN}/tracking?limit=20`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.setTrackingDestination",
    run: (conty) =>
      conty.campaigns.setTrackingDestination(CAMPAIGN_ID, { url: "https://loja.exemplo.com" }),
    method: "PUT",
    url: `${CAMPAIGN}/tracking/destination`,
    body: { url: "https://loja.exemplo.com" },
    key: null,
  },
  {
    name: "campaigns.shortLinks.create",
    run: (conty) =>
      conty.campaigns.shortLinks.create(CAMPAIGN_ID, { url: "https://loja.exemplo.com" }),
    method: "POST",
    url: `${CAMPAIGN}/short-links`,
    body: { url: "https://loja.exemplo.com" },
    key: IDEMPOTENCY,
  },
  {
    name: "campaigns.creatorInvoices",
    run: (conty) => conty.campaigns.creatorInvoices(CAMPAIGN_ID, { limit: 50 }),
    method: "GET",
    url: `${CAMPAIGN}/creator-invoices?limit=50`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.syncMetrics",
    run: (conty) => conty.campaigns.syncMetrics(CAMPAIGN_ID),
    method: "POST",
    url: `${CAMPAIGN}/sync-metrics`,
    body: undefined,
    key: null,
  },
  {
    name: "campaigns.syncMetricsJob",
    run: (conty) => conty.campaigns.syncMetricsJob(CAMPAIGN_ID, "job-1"),
    method: "GET",
    url: `${CAMPAIGN}/sync-metrics/jobs/job-1`,
    body: undefined,
    key: null,
  },
  {
    name: "conversionEvents.set",
    run: (conty) =>
      conty.conversionEvents.set({
        source: "posthog",
        events: [{ name: "purchase", counts: true }],
      }),
    method: "PUT",
    url: `${BASE}/conversion-events`,
    body: { source: "posthog", events: [{ name: "purchase", counts: true }] },
    key: null,
  },
];

describe("campaign insights requests", () => {
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

describe("campaigns.export", () => {
  it("returns the CSV as text and asks for text/csv", async () => {
    const csv = "Creator,Etapa\nAna Souza,Aprovados\n";
    const { conty, fetch } = setup([
      new Response(csv, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8" } }),
    ]);

    const { data, error } = await conty.campaigns.export(CAMPAIGN_ID, {
      stage: "approved",
      fields: ["creator_name", "stage"],
    });

    expect(error).toBeNull();
    expect(data).toBe(csv);
    expect(call(fetch).url).toBe(`${CAMPAIGN}/export?stage=approved&fields=creator_name%2Cstage`);
    expect(call(fetch).headers.get("Accept")).toBe("text/csv, application/json");
  });

  it("returns columns, rows and total for format json", async () => {
    const exported = {
      columns: [{ key: "creator_name", label: "Creator" }],
      rows: [{ creator_name: "Ana Souza" }],
      total: 1,
    };
    const { conty, fetch } = setup([json(exported)]);

    const { data } = await conty.campaigns.export(CAMPAIGN_ID, {
      stage: "approved",
      format: "json",
    });

    expect(data).toEqual(exported);
    expect(call(fetch).url).toBe(`${CAMPAIGN}/export?stage=approved&format=json`);
    expect(call(fetch).headers.get("Accept")).toBe("application/json");
  });

  it("returns the JSON error of a stage that is too large", async () => {
    const details = [{ path: "stage", message: "Filtre a etapa" }];
    const { conty } = setup([apiError(422, "export_too_large", {}, details)]);

    const { error } = await conty.campaigns.export(CAMPAIGN_ID, { stage: "overview" });

    expect(error).toMatchObject({ status: 422, code: "export_too_large", details });
  });
});

describe("campaign insights pagination", () => {
  it("walks the coupon pool by offset until has_more is false", async () => {
    const { conty, fetch } = setup([
      json({ data: [{ id: "p1" }, { id: "p2" }], total: 3, has_more: true }),
      json({ data: [{ id: "p3" }], total: 3, has_more: false }),
    ]);

    const ids: string[] = [];
    for await (const entry of conty.campaigns.coupons.pool.listAll(CAMPAIGN_ID, { limit: 2 })) {
      ids.push(entry.id);
    }

    expect(ids).toEqual(["p1", "p2", "p3"]);
    expect(call(fetch, 0).url).toBe(`${CAMPAIGN}/coupon-pool?limit=2&offset=0`);
    expect(call(fetch, 1).url).toBe(`${CAMPAIGN}/coupon-pool?limit=2&offset=2`);
  });

  it("walks results creators by offset until total", async () => {
    const page = (items: unknown[], offset: number) =>
      json({ items, total: 3, limit: 2, offset, sort: "views", order: "desc" });
    const { conty, fetch } = setup([page([{ id: "a" }, { id: "b" }], 0), page([{ id: "c" }], 2)]);

    const ids: string[] = [];
    for await (const creator of conty.campaigns.results.creatorsAll(CAMPAIGN_ID, { limit: 2 })) {
      ids.push((creator as unknown as { id: string }).id);
    }

    expect(ids).toEqual(["a", "b", "c"]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("walks tracking creators by cursor", async () => {
    const { conty, fetch } = setup([
      json({ creators: [{ id: "a" }], has_more: true, next_cursor: "c2" }),
      json({ creators: [{ id: "b" }], has_more: false, next_cursor: null }),
    ]);

    const ids: string[] = [];
    for await (const creator of conty.campaigns.trackingAll(CAMPAIGN_ID)) {
      ids.push((creator as unknown as { id: string }).id);
    }

    expect(ids).toEqual(["a", "b"]);
    expect(call(fetch, 1).url).toBe(`${CAMPAIGN}/tracking?cursor=c2`);
  });

  it("throws the 403 of a disabled module from salesAll", async () => {
    const { conty } = setup([apiError(403, "coupons_disabled")]);

    const iterate = async () => {
      for await (const _ of conty.campaigns.coupons.salesAll(CAMPAIGN_ID)) {
      }
    };

    await expect(iterate()).rejects.toMatchObject({ status: 403, code: "coupons_disabled" });
  });
});

describe("campaign insights errors", () => {
  it("returns the required scope on 403 insufficient_scope", async () => {
    const details = [{ required_scope: "campaigns:spend" }];
    const { conty, fetch } = setup([apiError(403, "insufficient_scope", {}, details)]);

    const { error } = await conty.campaigns.coupons.setCommissionBudget(CAMPAIGN_ID, {
      amount_cents: 100_000,
    });

    const [detail] = (error?.details ?? []) as { required_scope: string }[];
    expect(detail?.required_scope).toBe("campaigns:spend");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 409 on the tracking destination even with Idempotency-Key", async () => {
    const { conty, fetch } = setup([apiError(409, "invalid_transition")]);

    const { error } = await conty.campaigns.setTrackingDestination(
      CAMPAIGN_ID,
      { shortened: true },
      { idempotencyKey: "tracking-1" },
    );

    expect(error).toMatchObject({ status: 409, code: "invalid_transition" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
