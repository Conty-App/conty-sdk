import { describe, expect, it, vi } from "vitest";
import { ContyError, createContyApi } from "../../index";
import { API_KEY, apiError, BASE, CAMPAIGN_ID, call, IDEMPOTENCY, json, setup } from "./setup";

describe("createContyApi", () => {
  it("rejects a key that is not an API key", () => {
    expect(() => createContyApi({ apiKey: "cev_secret" })).toThrow(ContyError);
    try {
      createContyApi({ apiKey: "cev_secret" });
    } catch (error) {
      expect((error as ContyError).code).toBe("invalid_api_key");
    }
  });
});

describe("campaigns.list", () => {
  it("sends the key and serializes filters on the server query", async () => {
    const { conty, fetch } = setup([json({ data: [], has_more: false, next_cursor: null })]);

    const result = await conty.campaigns.list({
      status: ["approved", "paused"],
      q: "verão",
      limit: 50,
    });

    expect(result.error).toBeNull();
    const { url, headers, init } = call(fetch);
    expect(init?.method).toBe("GET");
    expect(url).toBe(`${BASE}/campaigns?status=approved%2Cpaused&q=ver%C3%A3o&limit=50`);
    expect(headers.get("Authorization")).toBe(`Bearer ${API_KEY}`);
    expect(headers.get("Idempotency-Key")).toBeNull();
  });

  it("retries a GET after 429 honoring Retry-After", async () => {
    const page = { data: [], has_more: false, next_cursor: null };
    const { conty, fetch, delays } = setup([
      apiError(429, "rate_limited", { "Retry-After": "2" }),
      json(page),
    ]);

    const result = await conty.campaigns.list();

    expect(result).toEqual({ data: page, error: null });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(delays).toEqual([2000]);
  });
});

describe("campaigns.listAll", () => {
  it("follows next_cursor keeping the same filters", async () => {
    const { conty, fetch } = setup([
      json({ data: [{ id: "a" }, { id: "b" }], has_more: true, next_cursor: "c2" }),
      json({ data: [{ id: "c" }], has_more: false, next_cursor: null }),
    ]);

    const ids: string[] = [];
    for await (const campaign of conty.campaigns.listAll({ status: "approved", limit: 2 })) {
      ids.push(campaign.id);
    }

    expect(ids).toEqual(["a", "b", "c"]);
    expect(call(fetch, 1).url).toBe(`${BASE}/campaigns?status=approved&limit=2&cursor=c2`);
  });

  it("throws the ContyError of a failed page", async () => {
    const { conty } = setup([apiError(403, "forbidden")]);

    const iterate = async () => {
      for await (const _ of conty.campaigns.listAll()) {
      }
    };

    await expect(iterate()).rejects.toMatchObject({ code: "forbidden", status: 403 });
  });
});

describe("campaigns.get", () => {
  it("returns the API error with request id and does not retry a 404", async () => {
    const { conty, fetch } = setup([apiError(404, "not_found")]);

    const { data, error } = await conty.campaigns.get(CAMPAIGN_ID);

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: 404, code: "not_found", requestId: "req_1" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(call(fetch).url).toBe(`${BASE}/campaigns/${CAMPAIGN_ID}`);
  });
});

describe("campaigns.items", () => {
  it("lists one stage of the board with its filters", async () => {
    const { conty, fetch } = setup([
      json({ data: [], has_more: false, next_cursor: null, total: 0, compatible_count: null }),
    ]);

    await conty.campaigns.items(CAMPAIGN_ID, {
      stage: "interested",
      networks: ["instagram", "tiktok"],
      only_compatible: true,
    });

    expect(call(fetch).url).toBe(
      `${BASE}/campaigns/${CAMPAIGN_ID}/items?stage=interested&networks=instagram%2Ctiktok&only_compatible=true`,
    );
  });
});

describe("campaigns.create", () => {
  const body = {
    name: "Verão 2027",
    status: "review" as const,
    description: "Lançamento da coleção de verão.",
    payment_type: "per_video" as const,
    budget_cents: 500_000,
    end_date: "2027-02-28",
    deliverables: [{ network: "instagram" as const, formats: ["reels" as const], videos_count: 1 }],
  };

  it("posts the body with a generated Idempotency-Key", async () => {
    const { conty, fetch } = setup([json({ id: CAMPAIGN_ID, kind: "agreement" }, 201)]);

    const result = await conty.campaigns.create(body);

    expect(result.data).toEqual({ id: CAMPAIGN_ID, kind: "agreement" });
    const { url, init, headers, body: sent } = call(fetch);
    expect(url).toBe(`${BASE}/campaigns`);
    expect(init?.method).toBe("POST");
    expect(headers.get("Idempotency-Key")).toBe(IDEMPOTENCY);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(sent).toEqual(body);
  });

  it("reuses the same Idempotency-Key when retrying after a timeout", async () => {
    const timeout = new DOMException("The operation timed out.", "TimeoutError");
    const { conty, fetch } = setup([timeout, json({ id: CAMPAIGN_ID }, 201)]);

    const result = await conty.campaigns.create(body, { idempotencyKey: "order-42" });

    expect(result.error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(call(fetch, 0).headers.get("Idempotency-Key")).toBe("order-42");
    expect(call(fetch, 1).headers.get("Idempotency-Key")).toBe("order-42");
  });

  it("does not retry a business rule error", async () => {
    const { conty, fetch } = setup([apiError(422, "end_date_required")]);

    const { error } = await conty.campaigns.create(body);

    expect(error?.code).toBe("end_date_required");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns a timeout error after the last retry without throwing", async () => {
    const timeout = new DOMException("The operation timed out.", "TimeoutError");
    const onError = vi.fn();
    const { conty, fetch } = setup([timeout, timeout, timeout], { onError });

    const { data, error } = await conty.campaigns.create(body);

    expect(data).toBeNull();
    expect(error?.code).toBe("timeout");
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledWith(error);
  });
});

describe("campaigns writes", () => {
  it("does not retry a PATCH without Idempotency-Key", async () => {
    const { conty, fetch } = setup([apiError(503, "internal_error")]);

    const { error } = await conty.campaigns.update(CAMPAIGN_ID, { budget_cents: 600_000 });

    expect(error?.status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(call(fetch).init?.method).toBe("PATCH");
    expect(call(fetch).headers.get("Idempotency-Key")).toBeNull();
  });

  it("retries a status change sent with Idempotency-Key", async () => {
    const { conty, fetch } = setup([apiError(502, "internal_error"), json({ id: CAMPAIGN_ID })]);

    const { error } = await conty.campaigns.setStatus(
      CAMPAIGN_ID,
      { status: "paused" },
      { idempotencyKey: "pause-1" },
    );

    expect(error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(call(fetch, 1).url).toBe(`${BASE}/campaigns/${CAMPAIGN_ID}/status`);
  });

  it("validates without Idempotency-Key", async () => {
    const { conty, fetch } = setup([
      json({
        valid: true,
        can_publish: false,
        missing: [],
        issues: [
          {
            path: "end_date",
            code: "end_date_required",
            message: "Informe a data de término da campanha.",
            blocking: false,
          },
        ],
        publish_cost_cents: null,
        balance_cents: null,
      }),
    ]);

    const { data } = await conty.campaigns.validate({ name: "Verão 2027", status: "draft" });

    expect(data?.valid).toBe(true);
    expect(data?.can_publish).toBe(false);
    expect(data?.issues[0]?.blocking).toBe(false);
    expect(call(fetch).init?.method).toBe("POST");
    expect(call(fetch).body).toEqual({ name: "Verão 2027", status: "draft" });
    expect(call(fetch).url).toBe(`${BASE}/campaigns/validate`);
    expect(call(fetch).headers.get("Idempotency-Key")).toBeNull();
  });
});

describe("campaigns.create agreement", () => {
  it("posts an agreement body with deliverables, scope options and briefings", async () => {
    const body = {
      kind: "agreement" as const,
      name: "Verão 2027",
      description: "Lançamento da coleção de verão.",
      status: "draft" as const,
      payment_type: "per_video" as const,
      budget_cents: 500_000,
      end_date: "2027-02-28",
      deliverables: [
        {
          key: "reels",
          network: "instagram" as const,
          formats: ["reels" as const, "collab" as const],
          videos_count: 1,
        },
        { key: "tiktok", network: "tiktok" as const, videos_count: 2 },
      ],
      scope_options: [
        {
          name: "Reels + TikTok",
          items: [
            { deliverable_key: "reels", quantity: 1 },
            { deliverable_key: "tiktok", quantity: 2 },
          ],
        },
      ],
      briefings: [{ title: "Briefing geral", body: "Mostre o produto em uso.", attachments: [] }],
    };
    const { conty, fetch } = setup([json({ id: CAMPAIGN_ID, kind: "agreement" }, 201)]);

    const { error } = await conty.campaigns.create(body);

    expect(error).toBeNull();
    expect(call(fetch).url).toBe(`${BASE}/campaigns`);
    expect(call(fetch).headers.get("Idempotency-Key")).toBe(IDEMPOTENCY);
    expect(call(fetch).body).toEqual(body);
  });

  it("returns the scope required to publish on 403 insufficient_scope", async () => {
    const details = [{ required_scope: "campaigns:spend" }];
    const { conty, fetch } = setup([apiError(403, "insufficient_scope", {}, details)]);

    const { data, error } = await conty.campaigns.setStatus(CAMPAIGN_ID, { status: "review" });

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: 403, code: "insufficient_scope", requestId: "req_1" });
    const [detail] = (error?.details ?? []) as { required_scope: string }[];
    expect(detail?.required_scope).toBe("campaigns:spend");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("campaigns.setStatus", () => {
  it("does not retry a 409 invalid_transition even with Idempotency-Key", async () => {
    const details = { from: "completed", to: "approved" };
    const { conty, fetch } = setup([apiError(409, "invalid_transition", {}, details)]);

    const { error } = await conty.campaigns.setStatus(
      CAMPAIGN_ID,
      { status: "approved" },
      { idempotencyKey: "resume-1" },
    );

    expect(error).toMatchObject({ status: 409, code: "invalid_transition", details });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(call(fetch).init?.method).toBe("POST");
    expect(call(fetch).headers.get("Idempotency-Key")).toBe("resume-1");
    expect(call(fetch).body).toEqual({ status: "approved" });
  });
});

describe("campaigns.remove", () => {
  it("sends DELETE and returns null data on 204", async () => {
    const { conty, fetch } = setup([new Response(null, { status: 204 })]);

    const result = await conty.campaigns.remove(CAMPAIGN_ID);

    expect(result).toEqual({ data: null, error: null });
    const { url, init, headers, body } = call(fetch);
    expect(url).toBe(`${BASE}/campaigns/${CAMPAIGN_ID}`);
    expect(init?.method).toBe("DELETE");
    expect(headers.get("Idempotency-Key")).toBeNull();
    expect(headers.get("Content-Type")).toBeNull();
    expect(body).toBeUndefined();
  });

  it("does not retry a 409 blocking_missions and returns its details", async () => {
    const details = { in_progress: 3 };
    const { conty, fetch } = setup([apiError(409, "blocking_missions", {}, details)]);

    const { error } = await conty.campaigns.remove(CAMPAIGN_ID);

    expect(error).toMatchObject({ status: 409, code: "blocking_missions", details });
    expect(call(fetch).url).toBe(`${BASE}/campaigns/${CAMPAIGN_ID}`);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a DELETE after a 503", async () => {
    const { conty, fetch } = setup([apiError(503, "internal_error")]);

    const { error } = await conty.campaigns.remove(CAMPAIGN_ID);

    expect(error?.status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("campaigns.renew", () => {
  it("posts the new dates with a generated Idempotency-Key", async () => {
    const body = {
      end_date: "2027-03-31",
      blocks: [{ block_id: "b1", delivery_date: "2027-03-20" }],
    };
    const { conty, fetch } = setup([json({ id: CAMPAIGN_ID, kind: "agreement" })]);

    const { data } = await conty.campaigns.renew(CAMPAIGN_ID, body);

    expect(data).toEqual({ id: CAMPAIGN_ID, kind: "agreement" });
    const { url, init, headers, body: sent } = call(fetch);
    expect(url).toBe(`${BASE}/campaigns/${CAMPAIGN_ID}/renew`);
    expect(init?.method).toBe("POST");
    expect(headers.get("Idempotency-Key")).toBe(IDEMPOTENCY);
    expect(sent).toEqual(body);
  });

  it("returns the job of a renewal by creator and keeps the caller key", async () => {
    const job = { job_id: "job_1", total: 2 };
    const { conty, fetch } = setup([json(job, 202)]);

    const { data } = await conty.campaigns.renew(
      CAMPAIGN_ID,
      { blocks: [{ block_id: "b1", delivery_date: "2027-03-20" }], creator_ids: ["c1", "c2"] },
      { idempotencyKey: "renew-1" },
    );

    expect(data).toEqual(job);
    expect(call(fetch).headers.get("Idempotency-Key")).toBe("renew-1");
  });

  it("returns the validation details of a 422", async () => {
    const details = [{ path: "blocks", message: "Required" }];
    const { conty, fetch } = setup([apiError(422, "validation_failed", {}, details)]);

    const { error } = await conty.campaigns.renew(CAMPAIGN_ID, { end_date: "2027-03-31" });

    expect(error).toMatchObject({ status: 422, code: "validation_failed", details });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("campaigns.publishCost", () => {
  it("gets the cost to publish and the balance", async () => {
    const cost = {
      publish_cost_cents: 550_000,
      budget_cents: 500_000,
      usage_rights_fee_cents: 50_000,
      balance_cents: 100_000,
      shortfall_cents: 450_000,
      blocked_reason: "insufficient_balance",
    };
    const { conty, fetch } = setup([json(cost)]);

    const { data } = await conty.campaigns.publishCost(CAMPAIGN_ID);

    expect(data).toEqual(cost);
    expect(call(fetch).init?.method).toBe("GET");
    expect(call(fetch).url).toBe(`${BASE}/campaigns/${CAMPAIGN_ID}/publish-cost`);
  });

  it("returns a 404 with its details", async () => {
    const details = { id: CAMPAIGN_ID };
    const { conty } = setup([apiError(404, "not_found", {}, details)]);

    const { error } = await conty.campaigns.publishCost(CAMPAIGN_ID);

    expect(error).toMatchObject({ status: 404, code: "not_found", details });
  });
});

describe("campaigns.briefings", () => {
  it("lists briefings with search and limit on the server query", async () => {
    const { conty, fetch } = setup([json({ data: [], has_more: false, next_cursor: null })]);

    const { error } = await conty.campaigns.briefings(CAMPAIGN_ID, { q: "reels", limit: 10 });

    expect(error).toBeNull();
    expect(call(fetch).init?.method).toBe("GET");
    expect(call(fetch).url).toBe(`${BASE}/campaigns/${CAMPAIGN_ID}/briefings?q=reels&limit=10`);
  });

  it("follows next_cursor in briefingsAll", async () => {
    const { conty, fetch } = setup([
      json({ data: [{ id: "b1" }], has_more: true, next_cursor: "2" }),
      json({ data: [{ id: "b2" }], has_more: false, next_cursor: null }),
    ]);

    const ids: string[] = [];
    for await (const briefing of conty.campaigns.briefingsAll(CAMPAIGN_ID, { limit: 1 })) {
      ids.push(briefing.id);
    }

    expect(ids).toEqual(["b1", "b2"]);
    expect(call(fetch, 1).url).toBe(`${BASE}/campaigns/${CAMPAIGN_ID}/briefings?limit=1&cursor=2`);
  });

  it("throws the ContyError of a failed page with its details", async () => {
    const details = { campaign_model: "campaign" };
    const { conty } = setup([apiError(422, "unsupported_for_campaign_model", {}, details)]);

    const iterate = async () => {
      for await (const _ of conty.campaigns.briefingsAll(CAMPAIGN_ID)) {
      }
    };

    await expect(iterate()).rejects.toMatchObject({
      code: "unsupported_for_campaign_model",
      details,
    });
  });
});

describe("campaigns.proposalSuggestions", () => {
  it("sends budget and creators limit on the query", async () => {
    const result = { proposal_suggested_amounts_cents: [80_000, 100_000, 120_000] };
    const { conty, fetch } = setup([json(result)]);

    const { data } = await conty.campaigns.proposalSuggestions({
      budget_cents: 500_000,
      creators_limit: 5,
    });

    expect(data).toEqual(result);
    expect(call(fetch).init?.method).toBe("GET");
    expect(call(fetch).url).toBe(
      `${BASE}/campaigns/proposal-suggestions?budget_cents=500000&creators_limit=5`,
    );
  });

  it("returns the validation details of a 422", async () => {
    const details = [{ path: "creators_limit", message: "Too small" }];
    const { conty } = setup([apiError(422, "validation_failed", {}, details)]);

    const { error } = await conty.campaigns.proposalSuggestions({ creators_limit: 0 });

    expect(error).toMatchObject({ status: 422, code: "validation_failed", details });
  });
});

describe("campaigns.attachBriefingFile", () => {
  const body = {
    briefing_id: "b1",
    file_name: "briefing.pdf",
    url: "https://example.com/briefing.pdf",
  };

  it("posts the file with a generated Idempotency-Key", async () => {
    const result = {
      briefing_title: "Briefing geral",
      attachment: { file_name: "briefing.pdf", mime_type: "application/pdf", size_bytes: 1024 },
    };
    const { conty, fetch } = setup([json(result, 201)]);

    const { data } = await conty.campaigns.attachBriefingFile(CAMPAIGN_ID, body);

    expect(data).toEqual(result);
    const { url, init, headers, body: sent } = call(fetch);
    expect(url).toBe(`${BASE}/campaigns/${CAMPAIGN_ID}/briefings/attachments`);
    expect(init?.method).toBe("POST");
    expect(headers.get("Idempotency-Key")).toBe(IDEMPOTENCY);
    expect(sent).toEqual(body);
  });

  it("returns the lock of a 409 with its details", async () => {
    const details = { fields: ["briefings"] };
    const { conty, fetch } = setup([apiError(409, "campaign_fields_locked", {}, details)]);

    const { error } = await conty.campaigns.attachBriefingFile(CAMPAIGN_ID, body, {
      idempotencyKey: "attach-1",
    });

    expect(error).toMatchObject({ status: 409, code: "campaign_fields_locked", details });
    expect(call(fetch).headers.get("Idempotency-Key")).toBe("attach-1");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
