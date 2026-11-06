import { describe, expect, it } from "vitest";
import { compact } from "../compact";

describe("compact", () => {
  it("drops null and undefined and keeps falsy values", () => {
    expect(compact({ a: null, b: undefined, c: 0, d: "", e: false })).toEqual({
      c: 0,
      d: "",
      e: false,
    });
  });
});
