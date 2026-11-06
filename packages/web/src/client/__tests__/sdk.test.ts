import { describe, expect, it } from "vitest";
import { BrandEventBatchSchema } from "../../../../../test/fixtures/event-schema";
import { fakes, KEY, sent, UUID } from "../../__tests__/helpers";
import { createSdk } from "../sdk";

describe("createSdk", () => {
  it("sends nothing without a key or with an empty name", () => {
    const deps = fakes();
    const sdk = createSdk(deps);

    expect(sdk.track("sign_up")).toBeUndefined();
    sdk.init(KEY);
    expect(sdk.track("")).toBeUndefined();
    expect(deps.fetch).not.toHaveBeenCalled();
  });

  it("sends $os web in properties without overwriting the caller value", async () => {
    const deps = fakes();
    const sdk = createSdk(deps);
    sdk.init(KEY);

    await sdk.track("sign_up");
    await sdk.track("sign_up", { $os: "ios-webview", external_id: 7 });

    const first = sent(deps.fetch, 0).body;
    expect(BrandEventBatchSchema.safeParse(first).success).toBe(true);
    expect(first.events[0]).toMatchObject({ external_id: UUID, properties: { $os: "web" } });
    expect(sent(deps.fetch, 1).body.events[0]).toMatchObject({
      external_id: "7",
      properties: { $os: "ios-webview" },
    });
  });

  it("swallows a fetch that throws synchronously", () => {
    const deps = fakes();
    deps.fetch.mockImplementation(() => {
      throw new TypeError("blocked");
    });
    const sdk = createSdk(deps);
    sdk.init(KEY);

    expect(sdk.track("sign_up")).toBeUndefined();
  });

  it("does not throw when props is null from plain JavaScript", () => {
    const deps = fakes();
    const sdk = createSdk(deps);
    sdk.init(KEY);
    const track = () => Reflect.apply(sdk.track, sdk, ["sign_up", null]);

    expect(track).not.toThrow();
    expect(track()).toBeUndefined();
    expect(deps.fetch).not.toHaveBeenCalled();
  });
});
