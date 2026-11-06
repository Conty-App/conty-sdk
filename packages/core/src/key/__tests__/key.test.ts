import { describe, expect, it } from "vitest";
import { eventsUrl, isPublishableKey, isSecretKey } from "../key";

describe("key", () => {
  it("accepts only strings with the cev_ prefix as secret keys", () => {
    expect(isSecretKey("cev_c_abc")).toBe(true);
    expect(isSecretKey("cpk_c_abc")).toBe(false);
    expect(isSecretKey(undefined)).toBe(false);
  });

  it("accepts only strings with the cpk_ prefix as publishable keys", () => {
    expect(isPublishableKey("cpk_c_abc")).toBe(true);
    expect(isPublishableKey("cev_c_abc")).toBe(false);
    expect(isPublishableKey(42)).toBe(false);
  });

  it("builds the events endpoint without duplicate slashes", () => {
    expect(eventsUrl("https://proxy.exemplo.com//")).toBe("https://proxy.exemplo.com/v1/events");
  });
});
