import { EVENT } from "@conty/core";
import { describe, expect, it } from "vitest";
import { BrandEventBatchSchema } from "../../../../../test/fixtures/event-schema";
import {
  createStorage,
  DEEP_LINK,
  KEY,
  NOW,
  SECRET_KEY,
  STORE,
  sent,
  setup,
  stored,
  UUID,
} from "../../__tests__/helpers";

describe("createClient (react-native)", () => {
  it("stores the UTM from the opening deep link and sends a body the API accepts", async () => {
    const { conty, fetch, storage } = setup(DEEP_LINK);

    conty.init(KEY);
    await conty.track("purchase", { value_cents: 1999.6, link_code: " abc ", plan: "mensal" });

    expect(stored(storage)).toEqual({
      utm: {
        utm_source: "conty",
        utm_medium: "creator",
        utm_campaign: "verao",
        utm_content: "cr_abc12345",
      },
      expires_at: NOW + 30 * 86_400_000,
    });
    const { url, init, body } = sent(fetch);
    expect(url).toBe("https://conty.link/v1/events");
    expect(init?.keepalive).toBeUndefined();
    expect(BrandEventBatchSchema.safeParse(body).success).toBe(true);
    expect(body.events[0]).toEqual({
      event: "purchase",
      occurred_at: "2026-11-06T10:00:00.000Z",
      external_id: UUID,
      value_cents: 2000,
      link_code: "abc",
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
      properties: {
        $os: "ios",
        $os_version: "17.4",
        plan: "mensal",
        utm_source: "conty",
        utm_medium: "creator",
      },
    });
  });

  it("sends Android $os and $os_version, with the version as text", async () => {
    const { conty, fetch } = setup(null, { platform: { OS: "android", Version: 34 } });

    conty.init(KEY);
    await conty.track("sign_up");

    const { body } = sent(fetch);
    expect(BrandEventBatchSchema.safeParse(body).success).toBe(true);
    expect(body.events[0].properties).toEqual({ $os: "android", $os_version: "34" });
  });

  it("does not overwrite $os or $os_version set by the caller", async () => {
    const { conty, fetch } = setup();

    conty.init(KEY);
    await conty.track("sign_up", { $os: "ipados" });

    expect(sent(fetch).body.events[0].properties).toEqual({ $os: "ipados", $os_version: "17.4" });
  });

  it("queues tracks made before init and sends them in one batch once ready", async () => {
    const { conty, fetch } = setup(DEEP_LINK);

    const first = conty.track("app_open");
    const second = conty.track("sign_up", { external_id: 42 });
    expect(fetch).not.toHaveBeenCalled();

    conty.init(KEY);
    const responses = await Promise.all([first, second]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(responses[0]?.status).toBe(202);
    expect(responses[1]).toBe(responses[0]);
    const { body } = sent(fetch);
    expect(BrandEventBatchSchema.safeParse(body).success).toBe(true);
    expect(body.events).toHaveLength(2);
    expect(body.events[0]).toMatchObject({ event: "app_open", utm_campaign: "verao" });
    expect(body.events[1]).toMatchObject({ event: "sign_up", external_id: "42" });
  });

  it("splits a large pre-init queue into sequential POSTs under the API limits", async () => {
    const { conty, fetch } = setup();
    const note = "x".repeat(1900);

    const pending = Array.from({ length: EVENT.batch.max }, (_, index) =>
      conty.track("view_item", { note, index }),
    );
    conty.init(KEY);
    const responses = await Promise.all(pending);

    const bodies = fetch.mock.calls.map(([, init]) => String(init.body));
    expect(bodies.length).toBeGreaterThan(1);
    for (const body of bodies) {
      expect(new TextEncoder().encode(body).byteLength).toBeLessThanOrEqual(EVENT.message.maxBytes);
    }
    const indexes = bodies.flatMap((body) =>
      JSON.parse(body).events.map(
        ({ properties }: { properties: { index: number } }) => properties.index,
      ),
    );
    expect(indexes).toEqual(Array.from({ length: EVENT.batch.max }, (_, index) => index));
    const results = await Promise.all(fetch.mock.results.map(({ value }) => value));
    const firstSize = JSON.parse(bodies[0] ?? "{}").events.length;
    expect(responses[0]).toBe(results[0]);
    expect(responses[firstSize]).toBe(results[1]);
    expect(responses.every(Boolean)).toBe(true);
  });

  it("replaces attribution with a deep link received while open (last touch)", async () => {
    const { conty, fetch, linking, storage } = setup(DEEP_LINK);

    conty.init(KEY);
    await conty.track("app_open");
    linking.open("minhaloja://home?utm_campaign=natal&utm_content=cr_0123abcd");
    await conty.track("purchase");

    expect(stored(storage).utm).toEqual({ utm_campaign: "natal", utm_content: "cr_0123abcd" });
    expect(sent(fetch, 1).body.events[0]).toMatchObject({
      utm_campaign: "natal",
      utm_content: "cr_0123abcd",
    });
  });

  it("keeps the stored attribution when a creator link arrives without utm_campaign", async () => {
    const { conty, fetch, linking, storage } = setup(DEEP_LINK);

    conty.init(KEY);
    await conty.track("app_open");
    linking.open("minhaloja://home?utm_content=cr_0123abcd");
    await conty.track("purchase");

    expect(stored(storage).utm).toMatchObject({
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
    });
    expect(sent(fetch, 1).body.events[0]).toMatchObject({
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
    });
  });

  it("accepts captureUrl before init, for expo-router and other routers", async () => {
    const { conty, fetch, storage } = setup();

    await conty.captureUrl(
      "https://minhaloja.com/p?utm_content=cr_abc12345&utm_campaign=ver%C3%A3o+2026",
    );
    conty.init(KEY);
    await conty.track("sign_up");

    expect(stored(storage).utm).toEqual({ utm_campaign: "verão 2026", utm_content: "cr_abc12345" });
    expect(sent(fetch).body.events[0]).toMatchObject({ utm_campaign: "verão 2026" });
  });

  it("uses the stored attribution on an open without UTM", async () => {
    const storage = createStorage({
      utm: { utm_campaign: "verao", utm_content: "cr_abc12345" },
      expires_at: NOW + 60_000,
    });
    const { conty, fetch } = setup("minhaloja://home", { storage });

    conty.init(KEY);
    await conty.track("sign_up");

    expect(sent(fetch).body.events[0]).toMatchObject({
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
    });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("drops expired attribution", async () => {
    const storage = createStorage({ utm: { utm_campaign: "velha" }, expires_at: NOW });
    const { conty, fetch } = setup(null, { storage });

    conty.init(KEY);
    await conty.track("sign_up");

    expect(sent(fetch).body.events[0].utm_campaign).toBeUndefined();
  });

  it("keeps the creator attribution when a campaign-only link arrives", async () => {
    const { conty, fetch, linking, storage } = setup(DEEP_LINK);

    conty.init(KEY);
    await conty.track("app_open");
    linking.open("minhaloja://home?utm_campaign=black-friday&utm_source=newsletter");
    await conty.track("purchase");

    expect(stored(storage).utm).toMatchObject({
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
    });
    expect(sent(fetch, 1).body.events[0]).toMatchObject({ utm_campaign: "verao" });
  });

  it("does not store UTM without a creator code in utm_content", async () => {
    const { conty, storage } = setup("minhaloja://home?utm_source=google&utm_medium=cpc");

    conty.init(KEY);
    await conty.track("sign_up");

    expect(storage.items.has(STORE)).toBe(false);
  });

  it("resolves a track made before init with undefined after the bounded wait", async () => {
    const { conty, fetch } = setup(null, { maxWaitMs: 10 });

    await expect(conty.track("sign_up")).resolves.toBeUndefined();

    conty.init(KEY);
    await conty.track("purchase");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(sent(fetch).body.events.map((event: { event: string }) => event.event)).toEqual([
      "purchase",
    ]);
  });

  it("drops tracks made before init once the queue holds the batch max", async () => {
    const { conty, fetch } = setup();
    const pending = Array.from({ length: EVENT.batch.max }, (_, index) =>
      conty.track("view", { index }),
    );

    await expect(conty.track("overflow")).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();

    conty.init(KEY);
    await Promise.all(pending);
    const names = fetch.mock.calls.flatMap(([, init]) =>
      JSON.parse(String(init.body)).events.map((event: { event: string }) => event.event),
    );
    expect(names).toHaveLength(EVENT.batch.max);
    expect(names).not.toContain("overflow");
  });

  it("ignores a secret key (cev_) and keeps queued tracks until the bounded wait", async () => {
    const { conty, fetch, linking } = setup(null, { maxWaitMs: 10 });

    conty.init(SECRET_KEY);

    await expect(conty.track("sign_up")).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
    expect(linking.getInitialURL).not.toHaveBeenCalled();
  });

  it("ignores a key without the cpk_ prefix and sends only after a valid key", async () => {
    const { conty, fetch, linking } = setup();

    conty.init("pk_errada");
    const pending = conty.track("sign_up");
    await Promise.resolve();
    expect(fetch).not.toHaveBeenCalled();
    expect(linking.getInitialURL).not.toHaveBeenCalled();

    conty.init(KEY);
    await pending;

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(conty.track("")).toBeUndefined();
  });

  it("swallows network and storage failures and accepts apiHost", async () => {
    const storage = createStorage();
    storage.getItem.mockRejectedValueOnce(new Error("disk"));
    storage.setItem.mockRejectedValue(new Error("disk"));
    const { conty, fetch } = setup(DEEP_LINK, { storage });
    fetch.mockRejectedValueOnce(new TypeError("Network request failed"));

    conty.init(KEY, { apiHost: "https://proxy.exemplo.com/" });

    await expect(conty.track("sign_up")).resolves.toBeUndefined();
    const { url, body } = sent(fetch);
    expect(url).toBe("https://proxy.exemplo.com/v1/events");
    expect(body.events[0].utm_campaign).toBe("verao");
  });

  it("resolves every queued track with undefined when a property cannot be serialized", async () => {
    const { conty, fetch } = setup();

    const first = conty.track("sign_up");
    const second = conty.track("purchase", { total: BigInt(10) });
    conty.init(KEY);

    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
    await expect(conty.track("purchase", { total: BigInt(10) })).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
