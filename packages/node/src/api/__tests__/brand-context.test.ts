import { describe, expect, it } from "vitest";
import { createContyApi } from "../../index";
import { API_KEY, BASE, CAMPAIGN_ID, call, json, setup } from "./setup";

const BRAND_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_BRAND_ID = "22222222-2222-4222-8222-222222222222";
const EMPTY_PAGE = { data: [], has_more: false, next_cursor: null };

describe("brand context", () => {
  it("sends X-Conty-Brand-Id on brand routes when created with brandId", async () => {
    const { conty, fetch } = setup([json(EMPTY_PAGE), json({ id: "m1" })], { brandId: BRAND_ID });

    await conty.campaigns.list();
    await conty.missions.get("m1");

    expect(call(fetch, 0).headers.get("X-Conty-Brand-Id")).toBe(BRAND_ID);
    expect(call(fetch, 1).headers.get("X-Conty-Brand-Id")).toBe(BRAND_ID);
  });

  it("does not send X-Conty-Brand-Id without brandId", async () => {
    const { conty, fetch } = setup([json(EMPTY_PAGE)]);

    await conty.campaigns.list();

    expect(call(fetch).headers.get("X-Conty-Brand-Id")).toBeNull();
  });

  it("never sends X-Conty-Brand-Id on /me and /brands", async () => {
    const { conty, fetch } = setup([json({}), json(EMPTY_PAGE), json({}), json(EMPTY_PAGE)], {
      brandId: BRAND_ID,
    });
    const client = conty.forBrand(OTHER_BRAND_ID);

    await conty.me.get();
    await conty.brands.list();
    await client.me.get();
    await client.brands.list();

    expect(fetch).toHaveBeenCalledTimes(4);
    for (let index = 0; index < 4; index++) {
      expect(call(fetch, index).headers.get("X-Conty-Brand-Id")).toBeNull();
    }
  });

  it("forBrand reuses the transport and fixes the header per client", async () => {
    const { conty, fetch } = setup([json({}), json(EMPTY_PAGE), json({})], {
      brandId: BRAND_ID,
    });
    const other = conty.forBrand(OTHER_BRAND_ID);

    await other.campaigns.get(CAMPAIGN_ID);
    await conty.creators.search();
    await other.forBrand(BRAND_ID).campaigns.get(CAMPAIGN_ID);

    expect(call(fetch, 0).headers.get("X-Conty-Brand-Id")).toBe(OTHER_BRAND_ID);
    expect(call(fetch, 0).headers.get("Authorization")).toBe(`Bearer ${API_KEY}`);
    expect(call(fetch, 1).headers.get("X-Conty-Brand-Id")).toBe(BRAND_ID);
    expect(call(fetch, 2).headers.get("X-Conty-Brand-Id")).toBe(BRAND_ID);
  });

  it("throws on an empty brandId", () => {
    expect(() => createContyApi({ apiKey: API_KEY, brandId: " " })).toThrow(
      expect.objectContaining({ code: "invalid_brand_id" }),
    );
    const { conty } = setup([]);
    expect(() => conty.forBrand("")).toThrow(expect.objectContaining({ code: "invalid_brand_id" }));
  });
});

describe("brands", () => {
  it("lists the brands of the key", async () => {
    const page = {
      data: [{ id: BRAND_ID, name: "Marca Exemplo", status: "active" }],
      has_more: false,
      next_cursor: null,
    };
    const { conty, fetch } = setup([json(page)]);

    const { data } = await conty.brands.list({ limit: 50 });

    expect(data).toEqual(page);
    expect(call(fetch).url).toBe(`${BASE}/brands?limit=50`);
  });

  it("listAll follows next_cursor", async () => {
    const { conty, fetch } = setup([
      json({ data: [{ id: BRAND_ID }], has_more: true, next_cursor: "c2" }),
      json({ data: [{ id: OTHER_BRAND_ID }], has_more: false, next_cursor: null }),
    ]);

    const ids: string[] = [];
    for await (const brand of conty.brands.listAll()) ids.push(brand.id);

    expect(ids).toEqual([BRAND_ID, OTHER_BRAND_ID]);
    expect(call(fetch, 1).url).toBe(`${BASE}/brands?cursor=c2`);
  });
});
