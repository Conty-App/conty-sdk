import { describe, expect, it } from "vitest";
import { apiError, BASE, call, json, setup } from "./setup";

function creator(id: string) {
  return { id, name: id, networks: [], pro: false };
}

describe("creators.search", () => {
  it("builds the query with comma-separated lists", async () => {
    const page = { data: [creator("c1")], has_more: false, next_cursor: null, total: 1 };
    const { conty, fetch } = setup([json(page)]);

    const { data } = await conty.creators.search({
      q: "maria",
      platforms: ["instagram", "tiktok"],
      niches: ["moda", "beleza"],
      locations: ["BR:SP:São Paulo", "BR:RJ"],
      followers_min: 10000,
      min_engagement_rate: 2,
      exclude_in_brand_campaigns: true,
      sort: "followers_desc",
      limit: 50,
    });

    expect(data).toEqual(page);
    const { url, init } = call(fetch);
    expect(init?.method).toBe("GET");
    const parsed = new URL(String(url));
    expect(`${parsed.origin}${parsed.pathname}`).toBe(`${BASE}/creators/search`);
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      q: "maria",
      platforms: "instagram,tiktok",
      niches: "moda,beleza",
      locations: "BR:SP:São Paulo,BR:RJ",
      followers_min: "10000",
      min_engagement_rate: "2",
      exclude_in_brand_campaigns: "true",
      sort: "followers_desc",
      limit: "50",
    });
  });

  it("omits empty lists and undefined filters", async () => {
    const { conty, fetch } = setup([
      json({ data: [], has_more: false, next_cursor: null, total: 0 }),
    ]);

    await conty.creators.search({ platforms: [], state: undefined });

    expect(call(fetch).url).toBe(`${BASE}/creators/search`);
  });

  it("returns creator_search_disabled in error without throwing or retrying", async () => {
    const { conty, fetch } = setup([apiError(403, "creator_search_disabled")]);

    const { data, error } = await conty.creators.search({ q: "maria" });

    expect(data).toBeNull();
    expect(error).toMatchObject({ status: 403, code: "creator_search_disabled" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("creators.searchAll", () => {
  it("follows next_cursor with the same filters and stops at has_more false", async () => {
    const { conty, fetch } = setup([
      json({ data: [creator("c1"), creator("c2")], has_more: true, next_cursor: "p2", total: 3 }),
      json({ data: [creator("c3")], has_more: false, next_cursor: "p3", total: 3 }),
    ]);

    const ids: string[] = [];
    for await (const item of conty.creators.searchAll({ niches: ["moda"], limit: 2 })) {
      ids.push(item.id);
    }

    expect(ids).toEqual(["c1", "c2", "c3"]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(call(fetch, 0).url).toBe(`${BASE}/creators/search?niches=moda&limit=2`);
    expect(call(fetch, 1).url).toBe(`${BASE}/creators/search?niches=moda&limit=2&cursor=p2`);
  });

  it("throws the ContyError when a page fails", async () => {
    const { conty } = setup([apiError(429, "rate_limited")], { maxRetries: 0 });

    await expect(async () => {
      for await (const _ of conty.creators.searchAll()) {
      }
    }).rejects.toMatchObject({ code: "rate_limited" });
  });
});
