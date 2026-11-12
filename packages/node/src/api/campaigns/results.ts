import { byTotal, paginateOffset } from "../pagination";
import type { Transport } from "../types";
import { segment } from "../url";
import type { CampaignResultsResource } from "./types";

export function createCampaignResults(transport: Transport): CampaignResultsResource {
  const read = <T>(id: string, suffix: string, query: object = {}) =>
    transport.request<T>({
      method: "GET",
      path: `/campaigns/${segment(id)}/results${suffix}`,
      query,
    });

  const creators: CampaignResultsResource["creators"] = (id, params = {}) =>
    read(id, "/creators", params);
  const trafficEvents: CampaignResultsResource["trafficEvents"] = (id, params = {}) =>
    read(id, "/traffic/events", params);

  return {
    overview: (id, params = {}) => read(id, "", params),
    timeseries: (id, params = {}) => read(id, "/timeseries", params),
    creators,
    creatorsAll: (id, params = {}) =>
      paginateOffset(
        (page) => creators(id, page),
        params,
        (page, offset) => byTotal(page.items, page.total, offset),
      ),
    deliveries: (id, creatorId, params = {}) =>
      read(id, `/creators/${segment(creatorId)}/deliveries`, params),
    traffic: (id, params = {}) => read(id, "/traffic", params),
    trafficEvents,
    trafficEventsAll: (id, params = {}) =>
      paginateOffset(
        (page) => trafficEvents(id, page),
        params,
        (page, offset) => byTotal(page.items, page.total, offset),
      ),
  };
}
