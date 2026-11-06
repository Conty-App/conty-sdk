import { describe, expect, it } from "vitest";
import { createAttribution, isActive, parseAttribution } from "../attribution";
import { cleanText, isCreatorCode, pickUtm } from "../utm";

const clock = { now: () => 1_000 };

describe("attribution", () => {
  it("expires 30 days after capture", () => {
    expect(createAttribution({ utm_content: "cr_11111111" }, clock)).toEqual({
      utm: { utm_content: "cr_11111111" },
      expires_at: 1_000 + 2_592_000_000,
    });
  });

  it("parses only a valid stored shape", () => {
    const raw = JSON.stringify({
      utm: { utm_campaign: "verao", utm_content: "cr_948643af", extra: 1 },
      expires_at: 5,
    });

    expect(parseAttribution(raw)).toEqual({
      utm: { utm_campaign: "verao", utm_content: "cr_948643af" },
      expires_at: 5,
    });
    expect(parseAttribution("{broken")).toBeNull();
    expect(
      parseAttribution(JSON.stringify({ utm: { utm_source: "x" }, expires_at: 5 })),
    ).toBeNull();
    expect(
      parseAttribution(JSON.stringify({ utm: { utm_content: "cr_948643af" }, expires_at: 5 })),
    ).toBeNull();
    expect(parseAttribution(null)).toBeNull();
  });

  it("is active only before expires_at", () => {
    expect(isActive({ utm: {}, expires_at: 1_001 }, clock)).toBe(true);
    expect(isActive({ utm: {}, expires_at: 1_000 }, clock)).toBe(false);
    expect(isActive(null, clock)).toBe(false);
  });
});

describe("utm", () => {
  it("trims, caps at 200 chars and requires utm_campaign with a creator code in utm_content", () => {
    expect(cleanText(`  ${"a".repeat(250)}  `)).toHaveLength(200);
    expect(cleanText("   ")).toBeUndefined();
    expect(pickUtm((key) => (key === "utm_source" ? "google" : null))).toBeNull();
    const link: Record<string, unknown> = {
      utm_campaign: " verao ",
      utm_content: " cr_11111111 ",
      utm_source: 7,
    };
    expect(pickUtm((key) => link[key])).toEqual({
      utm_campaign: "verao",
      utm_content: "cr_11111111",
    });
  });

  it("ignores a creator code without utm_campaign", () => {
    expect(pickUtm((key) => (key === "utm_content" ? "cr_11111111" : null))).toBeNull();
    expect(
      pickUtm((key) =>
        key === "utm_content" ? "cr_11111111" : key === "utm_campaign" ? " " : null,
      ),
    ).toBeNull();
  });

  it("ignores a campaign-only link and a utm_content that is not a creator code", () => {
    expect(pickUtm((key) => (key === "utm_campaign" ? "verao" : null))).toBeNull();
    expect(pickUtm((key) => (key === "utm_content" ? "banner-topo" : "verao"))).toBeNull();
    expect(pickUtm((key) => (key === "utm_content" ? "cr_94864" : null))).toBeNull();
  });

  it("accepts cr_ with 8 hex characters or a creator id in utm_content", () => {
    expect(isCreatorCode("CR_948643AF")).toBe(true);
    expect(isCreatorCode("948643af-0000-4000-8000-000000000001")).toBe(true);
    expect(isCreatorCode("cr_948643ag")).toBe(false);
    expect(isCreatorCode(undefined)).toBe(false);
  });
});
