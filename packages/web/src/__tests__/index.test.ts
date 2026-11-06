import { describe, expect, it } from "vitest";
import { BrandEventBatchSchema } from "../../../../test/fixtures/event-schema";
import { conty, createConty } from "../index";
import { fakes, KEY, NOW, SECRET_KEY, STORE, sent, UUID } from "./helpers";

describe('import { conty, createConty } from "@conty/web"', () => {
  it("installs nothing on window when imported", () => {
    expect(typeof conty.track).toBe("function");
    expect("conty" in window).toBe(false);
  });

  it("captures the UTM on init and sends the event to the default endpoint", async () => {
    const ports = fakes("?utm_source=conty&utm_campaign=verao&utm_content=cr_abc12345");
    const client = createConty(ports);

    client.init(KEY);
    await client.track("purchase", { value_cents: 1999.6, link_code: " abc ", plan: "mensal" });

    expect(JSON.parse(ports.items.get(STORE) ?? "null").expires_at).toBe(NOW + 30 * 86_400_000);
    const { url, init, body } = sent(ports.fetch);
    expect(url).toBe("https://conty.link/v1/events");
    expect(init?.keepalive).toBe(true);
    expect(BrandEventBatchSchema.safeParse(body).success).toBe(true);
    expect(body.events[0]).toEqual({
      event: "purchase",
      occurred_at: "2026-11-06T10:00:00.000Z",
      external_id: UUID,
      value_cents: 2000,
      link_code: "abc",
      utm_campaign: "verao",
      utm_content: "cr_abc12345",
      properties: { $os: "web", plan: "mensal", utm_source: "conty" },
    });
  });

  it("ignores a secret key (cev_) and warns once to use a publishable key", () => {
    const ports = fakes();
    const client = createConty(ports);

    client.init(SECRET_KEY);
    client.init(SECRET_KEY);

    expect(client.track("sign_up")).toBeUndefined();
    expect(ports.fetch).not.toHaveBeenCalled();
    expect(ports.warn).toHaveBeenCalledTimes(1);
    expect(ports.warn).toHaveBeenCalledWith("Conty: use a publishable key (cpk_) in the browser");
  });

  it("sends nothing before init or with a key without the cpk_ prefix", () => {
    const ports = fakes();
    const client = createConty(ports);

    expect(client.track("sign_up")).toBeUndefined();
    client.init("pk_errada");
    expect(client.track("sign_up")).toBeUndefined();
    expect(ports.fetch).not.toHaveBeenCalled();
  });

  it("swallows network failures and accepts apiHost", async () => {
    const ports = fakes();
    ports.fetch.mockRejectedValueOnce(new TypeError("offline"));
    const client = createConty(ports);

    client.init(KEY, { apiHost: "https://proxy.exemplo.com" });

    await expect(client.track("sign_up")).resolves.toBeUndefined();
    expect(sent(ports.fetch).url).toBe("https://proxy.exemplo.com/v1/events");
  });
});
