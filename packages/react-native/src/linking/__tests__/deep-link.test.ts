import { describe, expect, it } from "vitest";
import { queryParams, utmFromUrl } from "../deep-link";

describe("deep link", () => {
  it("reads the query before the fragment, decodes it and keeps the first value", () => {
    const params = queryParams("app://x?a=1&a=2&b=ver%C3%A3o+2026&=sem-nome&c#d=4");

    expect([...params]).toEqual([
      ["a", "1"],
      ["b", "verão 2026"],
    ]);
  });

  it("keeps the raw text when percent-encoding is invalid", () => {
    expect(queryParams("app://x?utm_campaign=%E0%A4%A")).toEqual(
      new Map([["utm_campaign", "%E0%A4%A"]]),
    );
  });

  it("returns UTM only with utm_campaign and a creator code in utm_content", () => {
    expect(utmFromUrl("app://x?utm_source=google")).toBeNull();
    expect(utmFromUrl("app://x?utm_content=cr_11111111")).toBeNull();
    expect(utmFromUrl("app://x?utm_campaign=verao&utm_content=%20cr_11111111%20")).toEqual({
      utm_campaign: "verao",
      utm_content: "cr_11111111",
    });
  });
});
