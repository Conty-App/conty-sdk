import { describe, expect, it } from "vitest";
import type { ContyApi } from "../../index";
import { apiError, BASE, call, IDEMPOTENCY, json, setup } from "./setup";

const MISSION_ID = "2b9e4d7a-1c3f-4e5a-8b6d-9f0a1c2e3d4b";
const MISSION = `${BASE}/missions/${MISSION_ID}`;
const CHECK_ID = "4d6f8a0c-2e4a-4c6e-8a0c-2e4a6c8e0a2c";

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
    name: "missions.shipProduct",
    run: (conty) => conty.missions.shipProduct(MISSION_ID, { tracking_code: "AA123456789BR" }),
    method: "POST",
    url: `${MISSION}/product-shipment`,
    body: { tracking_code: "AA123456789BR" },
    key: null,
  },
  {
    name: "missions.productShipment",
    run: (conty) => conty.missions.productShipment(MISSION_ID),
    method: "GET",
    url: `${MISSION}/product-shipment`,
    body: undefined,
    key: null,
  },
  {
    name: "missions.setPostUrl",
    run: (conty) =>
      conty.missions.setPostUrl(MISSION_ID, {
        network: "instagram",
        url: "https://instagram.com/p/abc",
      }),
    method: "PUT",
    url: `${MISSION}/post-url`,
    body: { network: "instagram", url: "https://instagram.com/p/abc" },
    key: null,
  },
  {
    name: "missions.setPostedAt",
    run: (conty) => conty.missions.setPostedAt(MISSION_ID, { posted_at: "2026-12-01" }),
    method: "PUT",
    url: `${MISSION}/posted-at`,
    body: { posted_at: "2026-12-01" },
    key: null,
  },
  {
    name: "missions.acceptPostCheck",
    run: (conty) => conty.missions.acceptPostCheck(MISSION_ID, { check_id: CHECK_ID }),
    method: "POST",
    url: `${MISSION}/post-check/accept`,
    body: { check_id: CHECK_ID },
    key: null,
  },
  {
    name: "missions.createCoupon",
    run: (conty) => conty.missions.createCoupon(MISSION_ID, { code: "ANA10" }),
    method: "POST",
    url: `${MISSION}/coupon`,
    body: { code: "ANA10" },
    key: IDEMPOTENCY,
  },
  {
    name: "missions.comments.list",
    run: (conty) => conty.missions.comments.list(MISSION_ID, { channel: "creator", limit: 20 }),
    method: "GET",
    url: `${MISSION}/comments?channel=creator&limit=20`,
    body: undefined,
    key: null,
  },
  {
    name: "missions.comments.create",
    run: (conty) =>
      conty.missions.comments.create(MISSION_ID, { channel: "creator", body: "Ficou ótimo!" }),
    method: "POST",
    url: `${MISSION}/comments`,
    body: { channel: "creator", body: "Ficou ótimo!" },
    key: IDEMPOTENCY,
  },
  {
    name: "missions.notify",
    run: (conty) => conty.missions.notify(MISSION_ID, { type: "approved" }),
    method: "POST",
    url: `${MISSION}/notify`,
    body: { type: "approved" },
    key: null,
  },
  {
    name: "missions.syncMetrics",
    run: (conty) => conty.missions.syncMetrics(MISSION_ID),
    method: "POST",
    url: `${MISSION}/sync-metrics`,
    body: undefined,
    key: null,
  },
  {
    name: "missions.scriptFile",
    run: (conty) => conty.missions.scriptFile(MISSION_ID, { version_id: "v1" }),
    method: "GET",
    url: `${MISSION}/script-file?version_id=v1`,
    body: undefined,
    key: null,
  },
  {
    name: "missions.deliveryDownload",
    run: (conty) => conty.missions.deliveryDownload(MISSION_ID),
    method: "GET",
    url: `${MISSION}/delivery-download`,
    body: undefined,
    key: null,
  },
  {
    name: "postChecks.accept",
    run: (conty) =>
      conty.postChecks.accept({ items: [{ mission_id: MISSION_ID, check_id: CHECK_ID }] }),
    method: "POST",
    url: `${BASE}/post-checks/accept`,
    body: { items: [{ mission_id: MISSION_ID, check_id: CHECK_ID }] },
    key: null,
  },
];

describe("delivery requests", () => {
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

describe("missions delivery", () => {
  it("returns the product shipment with photo and carrier status", async () => {
    const shipment = {
      shipped_at: "2026-11-20T12:00:00.000Z",
      tracking_code: "AA123456789BR",
      received_at: "2026-11-24T15:00:00.000Z",
      received_photo_url: "https://storage.example.com/photo.jpg?sig=1",
      carrier_status: "delivered",
      carrier_delivered_at: "2026-11-24T10:00:00.000Z",
    };
    const { conty } = setup([json(shipment)]);

    const { data } = await conty.missions.productShipment(MISSION_ID);

    expect(data?.carrier_status).toBe("delivered");
    expect(data?.received_photo_url).toBe(shipment.received_photo_url);
  });

  it("does not retry a 409 on the product shipment even with Idempotency-Key", async () => {
    const { conty, fetch } = setup([apiError(409, "already_received")]);

    const { error } = await conty.missions.shipProduct(MISSION_ID, undefined, {
      idempotencyKey: "ship-1",
    });

    expect(error).toMatchObject({ status: 409, code: "already_received" });
    expect(call(fetch).headers.get("Idempotency-Key")).toBe("ship-1");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns the required scope on 403 insufficient_scope", async () => {
    const details = [{ required_scope: "campaigns:write" }];
    const { conty, fetch } = setup([apiError(403, "insufficient_scope", {}, details)]);

    const { error } = await conty.missions.comments.create(MISSION_ID, {
      channel: "agency",
      body: "Pode revisar?",
    });

    const [detail] = (error?.details ?? []) as { required_scope: string }[];
    expect(detail?.required_scope).toBe("campaigns:write");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries a coupon creation after a 429 with the same generated key", async () => {
    const { conty, fetch } = setup([
      apiError(429, "rate_limited"),
      json({ id: MISSION_ID }, 201),
    ]);

    const { error } = await conty.missions.createCoupon(MISSION_ID, { coupon_id: "c1" });

    expect(error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(call(fetch, 1).headers.get("Idempotency-Key")).toBe(IDEMPOTENCY);
  });
});
