import { describe, expect, it } from "vitest";
import { fakes, NOW, STORE } from "../../__tests__/helpers";
import { attributionStore } from "../store";

describe("attributionStore", () => {
  it("stores for 30 days and returns the UTM while valid", () => {
    const deps = fakes("?utm_campaign=ver%C3%A3o+2026&utm_content=cr_abc12345&utm_term=x");
    const store = attributionStore(deps);

    store.capture();

    expect(JSON.parse(deps.items.get(STORE) ?? "null")).toEqual({
      utm: { utm_campaign: "verão 2026", utm_content: "cr_abc12345" },
      expires_at: NOW + 30 * 86_400_000,
    });
    expect(store.read()).toEqual({ utm_campaign: "verão 2026", utm_content: "cr_abc12345" });
  });

  it("removes a stored value with an invalid shape", () => {
    const deps = fakes();
    deps.items.set(STORE, "{quebrado");

    expect(attributionStore(deps).read()).toEqual({});
    expect(deps.items.has(STORE)).toBe(false);
  });

  it("keeps working when localStorage throws", () => {
    const denied = () => {
      throw new DOMException("denied", "SecurityError");
    };
    const store = attributionStore({
      ...fakes("?utm_campaign=verao"),
      storage: { getItem: denied, setItem: denied, removeItem: denied },
    });

    expect(() => store.capture()).not.toThrow();
    expect(store.read()).toEqual({});
  });
});
