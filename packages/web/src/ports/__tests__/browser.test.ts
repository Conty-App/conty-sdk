import { describe, expect, it } from "vitest";
import { fakes } from "../../__tests__/helpers";
import { browserPorts } from "../browser";

describe("browserPorts", () => {
  it("uses what was injected", () => {
    const { fetch, clock, randomId, storage, location, warn } = fakes();

    expect(browserPorts({ fetch, clock, randomId, storage, location, warn })).toEqual({
      fetch,
      clock,
      randomId,
      storage,
      location,
      warn,
    });
  });

  it("defaults to the browser localStorage, location and clock", () => {
    const ports = browserPorts();

    ports.storage.setItem("conty_test", "1");

    expect(window.localStorage.getItem("conty_test")).toBe("1");
    ports.storage.removeItem("conty_test");
    expect(ports.storage.getItem("conty_test")).toBeNull();
    expect(ports.location.search).toBe(window.location.search);
    expect(ports.clock).toBe(Date);
    expect(typeof ports.warn).toBe("function");
  });
});
