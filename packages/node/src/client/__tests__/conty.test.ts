import { describe, expect, it, type Mock, vi } from "vitest";
import { BrandEventBatchSchema } from "../../../../../test/fixtures/event-schema";
import { ContyError, type ContyOptions, createConty } from "../../index";

const KEY = `cev_c_${"A".repeat(43)}`;
const UUID = "00000000-0000-4000-8000-000000000001";
const NOW = Date.parse("2026-11-06T10:00:00.000Z");

type FetchMock = Mock<(url: string, init: RequestInit) => Promise<Response>>;

function apiError(status: number, error: object, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error }), { status, headers });
}

function setup(responses: Response[] = [], options: Partial<ContyOptions> = {}) {
  const fetch: FetchMock = vi.fn((_url, init) => {
    const events = JSON.parse(String(init.body)).events;
    return Promise.resolve(new Response(JSON.stringify({ accepted: events.length })));
  });
  for (const response of responses) fetch.mockResolvedValueOnce(response);
  const delays: number[] = [];
  const conty = createConty({
    key: KEY,
    fetch,
    clock: { now: () => NOW },
    randomId: () => UUID,
    sleep: async (ms) => {
      delays.push(ms);
    },
    ...options,
  });
  return { conty, fetch, delays };
}

function sent(fetch: FetchMock, call = 0) {
  const [url, init] = fetch.mock.calls[call] ?? [];
  return { url, init, body: JSON.parse(String(init?.body)) };
}

describe("Conty.track", () => {
  it("sends a body the API accepts with the key in Authorization", async () => {
    const { conty, fetch } = setup();

    const result = await conty.track({
      event: "purchase",
      external_id: "pedido-1",
      value_cents: 15990,
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
      properties: { currency: "BRL" },
    });

    expect(result).toEqual({ data: { accepted: 1 }, error: null });
    const { url, init, body } = sent(fetch);
    expect(url).toBe("https://conty.link/v1/events");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    });
    expect(BrandEventBatchSchema.safeParse(body).success).toBe(true);
    expect(body.events[0]).toEqual({
      event: "purchase",
      occurred_at: "2026-11-06T10:00:00.000Z",
      external_id: "pedido-1",
      value_cents: 15990,
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
      properties: { currency: "BRL" },
    });
  });

  it("drops null, fills occurred_at and external_id and honors apiHost", async () => {
    const { conty, fetch } = setup([], { apiHost: "https://proxy.exemplo.com/" });

    await conty.track({
      event: "sign_up",
      external_id: null,
      value_cents: null,
      link_code: null,
      utm_campaign: null,
      utm_content: null,
      occurred_at: new Date("2026-11-05T08:00:00.000Z"),
    });

    const { url, body } = sent(fetch);
    expect(url).toBe("https://proxy.exemplo.com/v1/events");
    expect(BrandEventBatchSchema.safeParse(body).success).toBe(true);
    expect(body.events[0]).toEqual({
      event: "sign_up",
      external_id: UUID,
      occurred_at: "2026-11-05T08:00:00.000Z",
    });
  });

  it("sends what the API validates and returns its 400 through error", async () => {
    const invalid = apiError(400, { code: "invalid_event_batch", message: "Lote inválido." });
    const onError = vi.fn();
    const { conty, fetch } = setup([invalid], { onError });

    const { data, error } = await conty.track({ event: "Compra Feita", value_cents: 19.9 });

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: 400, code: "invalid_event_batch" });
    expect(onError).toHaveBeenCalledWith(error);
    expect(sent(fetch).body.events[0]).toMatchObject({ event: "Compra Feita", value_cents: 19.9 });
  });

  it("throws only on programmer error: key without the cev_ prefix", () => {
    expect(() => createConty({ key: "pk_errada" })).toThrow(ContyError);
  });

  it("refuses a publishable key (cpk_) on the server", () => {
    expect(() => createConty({ key: `cpk_c_${"A".repeat(43)}` })).toThrow(/secret key \(cev_\)/);
  });

  it("treats an empty external_id as missing", async () => {
    const { conty, fetch } = setup();

    await conty.track({ event: "sign_up", external_id: "" });

    expect(sent(fetch).body.events[0].external_id).toBe(UUID);
  });
});

describe("Conty.trackBatch", () => {
  it("splits into batches of 100 events", async () => {
    const { conty, fetch } = setup();
    const events = Array.from({ length: 250 }, (_, i) => ({
      event: "purchase",
      external_id: `p-${i}`,
    }));

    const result = await conty.trackBatch(events);

    expect(result).toEqual({ data: { accepted: 250 }, error: null });
    const sizes = fetch.mock.calls.map((_, call) => sent(fetch, call).body.events.length);
    expect(sizes).toEqual([100, 100, 50]);
    for (const call of fetch.mock.calls.keys()) {
      expect(BrandEventBatchSchema.safeParse(sent(fetch, call).body).success).toBe(true);
    }
  });

  it("returns the error with the count accepted by earlier batches", async () => {
    const invalid = apiError(400, { code: "invalid_event_batch", message: "Lote inválido." });
    const accepted = () => new Response(JSON.stringify({ accepted: 100 }));
    const { conty, fetch } = setup([accepted(), accepted(), invalid]);
    const events = Array.from({ length: 250 }, (_, i) => ({
      event: "purchase",
      external_id: `p-${i}`,
    }));

    const { data, error } = await conty.trackBatch(events);

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: 400, code: "invalid_event_batch", accepted: 200 });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("splits before exceeding the 120 KB message limit", async () => {
    const { conty, fetch } = setup();
    const properties = { note: "x".repeat(1900) };
    const events = Array.from({ length: 90 }, (_, i) => ({
      event: "purchase",
      external_id: `p-${i}`,
      properties,
    }));

    await conty.trackBatch(events);

    expect(fetch).toHaveBeenCalledTimes(2);
    for (const call of fetch.mock.calls.keys()) {
      const { body } = sent(fetch, call);
      expect(new TextEncoder().encode(JSON.stringify(body)).byteLength).toBeLessThan(119 * 1024);
      expect(BrandEventBatchSchema.safeParse(body).success).toBe(true);
    }
  });
});

describe("errors and retry", () => {
  it("retries on 429 after waiting for Retry-After", async () => {
    const limited = apiError(
      429,
      { code: "rate_limited", message: "Muitas." },
      { "Retry-After": "7" },
    );
    const { conty, fetch, delays } = setup([limited]);

    const result = await conty.track({ event: "sign_up" });

    expect(result).toEqual({ data: { accepted: 1 }, error: null });
    expect(delays).toEqual([7_000]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("waits the full 60 s Retry-After the API sends on 429", async () => {
    const limited = apiError(
      429,
      { code: "rate_limited", message: "Muitas." },
      { "Retry-After": "60" },
    );
    const { conty, delays } = setup([limited]);

    const result = await conty.track({ event: "sign_up" });

    expect(result).toEqual({ data: { accepted: 1 }, error: null });
    expect(delays).toEqual([60_000]);
  });

  it("stops after 3 attempts on 5xx with backoff and returns the API error", async () => {
    const unavailable = () =>
      apiError(503, { code: "ingest_unavailable", message: "Recebimento indisponível." });
    const { conty, fetch, delays } = setup([unavailable(), unavailable(), unavailable()]);

    const { data, error } = await conty.track({ event: "sign_up" });

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: 503, code: "ingest_unavailable", accepted: 0 });
    expect(delays).toHaveLength(2);
    expect(delays[0]).toBeLessThan(500);
    expect(delays[1]).toBeLessThan(1_000);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("honors maxRetries", async () => {
    const failure = apiError(500, { code: "internal_error", message: "Erro interno." });
    const { conty, fetch } = setup([failure], { maxRetries: 0 });

    const { error } = await conty.track({ event: "sign_up" });

    expect(error).toMatchObject({ status: 500 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("clamps maxRetries to an integer between 0 and 10", async () => {
    const failing = () => apiError(500, { code: "internal_error", message: "Erro interno." });
    const many = setup(Array.from({ length: 12 }, failing), { maxRetries: 1_000 });
    const broken = setup([failing(), failing(), failing()], { maxRetries: Number.NaN });
    const negative = setup([failing()], { maxRetries: -3 });
    const fraction = setup([failing(), failing()], { maxRetries: 1.7 });

    await many.conty.track({ event: "sign_up" });
    await broken.conty.track({ event: "sign_up" });
    await negative.conty.track({ event: "sign_up" });
    await fraction.conty.track({ event: "sign_up" });

    expect(many.fetch).toHaveBeenCalledTimes(11);
    expect(broken.fetch).toHaveBeenCalledTimes(3);
    expect(negative.fetch).toHaveBeenCalledTimes(1);
    expect(fraction.fetch).toHaveBeenCalledTimes(2);
  });

  it("aborts an attempt after timeoutMs and returns timeout after the last one", async () => {
    const { conty, fetch } = setup([], { timeoutMs: 20, maxRetries: 1 });
    fetch.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );

    const { error } = await conty.track({ event: "sign_up" });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sent(fetch).init?.signal).toBeInstanceOf(AbortSignal);
    expect(error).toMatchObject({ code: "timeout", status: null });
  });

  it("does not retry on 4xx and reads code, message and details from the envelope", async () => {
    const invalid = apiError(422, {
      code: "invalid_event_batch",
      message: "Lote de eventos inválido.",
      details: { index: 0 },
    });
    const { conty, fetch } = setup([invalid]);

    const { error } = await conty.track({ event: "sign_up" });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(ContyError);
    expect(error).toMatchObject({
      status: 422,
      code: "invalid_event_batch",
      message: "Lote de eventos inválido.",
      details: { index: 0 },
    });
  });

  it("becomes network_error when every attempt fails on the network", async () => {
    const onError = vi.fn();
    const { conty, fetch } = setup([], { onError });
    fetch.mockRejectedValue(new TypeError("fetch failed"));

    const { error } = await conty.track({ event: "sign_up" });

    expect(error).toMatchObject({ code: "network_error", status: null, message: "fetch failed" });
    expect(onError).toHaveBeenCalledWith(error);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("returns invalid_event without fetching when track gets an invalid Date", async () => {
    const onError = vi.fn();
    const { conty, fetch } = setup([], { onError });

    const result = await conty.track({ event: "purchase", occurred_at: new Date(Number.NaN) });

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(ContyError);
    expect(result.error).toMatchObject({ status: null, code: "invalid_event", accepted: 0 });
    expect(onError).toHaveBeenCalledWith(result.error);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns invalid_event without fetching when trackBatch gets an invalid Date", async () => {
    const { conty, fetch } = setup();

    const result = await conty.trackBatch([
      { event: "lead" },
      { event: "purchase", occurred_at: new Date("not a date") },
    ]);

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({ status: null, code: "invalid_event" });
    expect(fetch).not.toHaveBeenCalled();
  });
});
