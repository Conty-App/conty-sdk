import { describe, expect, it } from "vitest";
import { BrandEventBatchSchema } from "../../../../../test/fixtures/event-schema";
import { fakes, KEY, NOW, SECRET_KEY, STORE, scriptTag, sent, UUID } from "../../__tests__/helpers";
import { install } from "../install";
import type { ContyTarget } from "../types";

const SDK_URL = "https://conty.link/sdk.js";

describe("script tag (sdk.js)", () => {
  it("stores the URL attribution and sends a body the API accepts", () => {
    const deps = fakes(
      "?utm_source=conty&utm_medium=creator&utm_campaign=verao&utm_content=cr_abc12345",
    );
    const target: ContyTarget = {
      conty: [
        ["init", KEY],
        ["track", "purchase", { value_cents: 15990, currency: "BRL", external_id: "pedido-1" }],
      ],
    };

    install(target, scriptTag(SDK_URL), deps);

    expect(JSON.parse(deps.items.get(STORE) ?? "null")).toEqual({
      utm: {
        utm_source: "conty",
        utm_medium: "creator",
        utm_campaign: "verao",
        utm_content: "cr_abc12345",
      },
      expires_at: NOW + 30 * 86_400_000,
    });
    const { url, init, body } = sent(deps.fetch);
    expect(url).toBe("https://conty.link/v1/events");
    expect(init?.method).toBe("POST");
    expect(init?.keepalive).toBe(true);
    expect(init?.headers).toEqual({
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    });
    expect(BrandEventBatchSchema.safeParse(body).success).toBe(true);
    expect(body.events[0]).toMatchObject({
      event: "purchase",
      external_id: "pedido-1",
      value_cents: 15990,
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
      properties: { $os: "web", currency: "BRL", utm_source: "conty", utm_medium: "creator" },
    });
  });

  it("uses the stored attribution on a visit without UTM and generates external_id", () => {
    const deps = fakes("", {
      utm: { utm_campaign: "verao", utm_content: "cr_abc12345" },
      expires_at: NOW + 1,
    });
    install({}, scriptTag(SDK_URL, KEY), deps)?.track("sign_up");

    const { body } = sent(deps.fetch);
    expect(BrandEventBatchSchema.safeParse(body).success).toBe(true);
    expect(body.events[0]).toEqual({
      event: "sign_up",
      occurred_at: "2026-11-06T10:00:00.000Z",
      external_id: UUID,
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
      properties: { $os: "web" },
    });
  });

  it("drops and removes expired attribution", () => {
    const deps = fakes("", { utm: { utm_campaign: "velha" }, expires_at: NOW });
    const target: ContyTarget = {
      conty: [
        ["init", KEY],
        ["track", "sign_up"],
      ],
    };

    install(target, scriptTag(SDK_URL), deps);

    expect(sent(deps.fetch).body.events[0].utm_campaign).toBeUndefined();
    expect(deps.items.has(STORE)).toBe(false);
  });

  it("does not store UTM without a creator code in utm_content", () => {
    const deps = fakes("?utm_source=google&utm_medium=cpc");

    install({}, scriptTag(SDK_URL), deps);

    expect(deps.items.has(STORE)).toBe(false);
  });

  it("keeps the creator attribution when a campaign-only link arrives (last touch with creator)", () => {
    const saved = {
      utm: { utm_campaign: "verao", utm_content: "cr_abc12345" },
      expires_at: NOW + 1,
    };
    const deps = fakes("?utm_source=newsletter&utm_campaign=black-friday", saved);

    install({}, scriptTag(SDK_URL, KEY), deps)?.track("sign_up");

    expect(JSON.parse(deps.items.get(STORE) ?? "null")).toEqual(saved);
    expect(sent(deps.fetch).body.events[0]).toMatchObject({
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
    });
  });

  it("keeps the stored attribution when a creator link arrives without utm_campaign", () => {
    const saved = {
      utm: { utm_campaign: "verao", utm_content: "cr_abc12345" },
      expires_at: NOW + 1,
    };
    const deps = fakes("?utm_source=conty&utm_content=cr_0123abcd", saved);

    install({}, scriptTag(SDK_URL, KEY), deps)?.track("sign_up");

    expect(JSON.parse(deps.items.get(STORE) ?? "null")).toEqual(saved);
    expect(sent(deps.fetch).body.events[0]).toMatchObject({
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
    });
  });

  it("replays calls stored in the q queue stub", () => {
    const deps = fakes();
    const q: unknown[][] = [];
    const stub = {
      q,
      track: (...args: unknown[]) => q.push(args),
    };
    stub.track("purchase", { value_cents: 15990, external_id: "pedido-1" });

    install({ conty: stub }, scriptTag(SDK_URL, KEY), deps);

    expect(deps.fetch).toHaveBeenCalledTimes(1);
    expect(sent(deps.fetch).body.events[0]).toMatchObject({
      event: "purchase",
      value_cents: 15990,
      external_id: "pedido-1",
    });
  });

  it("derives the endpoint from a script served at /sdk.js and accepts apiHost on init", () => {
    const deps = fakes();
    const conty = install({}, scriptTag("https://eventos.exemplo.com/sdk.js?v=2", KEY), deps);
    conty?.track("sign_up");
    conty?.init(KEY, { apiHost: "https://proxy.exemplo.com/" });
    conty?.track("sign_up");

    expect(sent(deps.fetch, 0).url).toBe("https://eventos.exemplo.com/v1/events");
    expect(sent(deps.fetch, 1).url).toBe("https://proxy.exemplo.com/v1/events");
  });

  it("sends to the Conty API when the script comes from a CDN or another path", () => {
    const sources = [
      "https://cdn.jsdelivr.net/npm/@conty/web@0.1.0/dist/sdk.js",
      "https://unpkg.com/@conty/web/dist/sdk.js",
      "https://minhaloja.com/assets/sdk.js",
      "not a url",
    ];

    for (const src of sources) {
      const deps = fakes();
      install({}, scriptTag(src, KEY), deps)?.track("sign_up");
      expect(sent(deps.fetch).url).toBe("https://conty.link/v1/events");
    }
  });

  it("skips queued calls that are not argument lists", () => {
    const deps = fakes();
    const target: ContyTarget = {
      conty: ["track", ["init", KEY], 7, ["track", "sign_up"], ["unknown"]],
    };

    install(target, scriptTag(SDK_URL), deps);

    expect(deps.fetch).toHaveBeenCalledTimes(1);
  });

  it("ignores a secret key in data-key with one warning", () => {
    const deps = fakes();

    install({}, scriptTag(SDK_URL, SECRET_KEY), deps)?.track("sign_up");

    expect(deps.fetch).not.toHaveBeenCalled();
    expect(deps.warn).toHaveBeenCalledTimes(1);
  });

  it("ignores a key without the cpk_ prefix and never loads twice", () => {
    const deps = fakes();
    const target: ContyTarget = {};

    install(target, scriptTag(SDK_URL, "pk_errada"), deps)?.track("sign_up");
    const first = target.conty;

    expect(install(target, scriptTag(SDK_URL, KEY), deps)).toBeUndefined();
    expect(target.conty).toBe(first);
    expect(deps.fetch).not.toHaveBeenCalled();
  });
});
