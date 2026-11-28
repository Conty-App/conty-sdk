import type { RandomId } from "@conty/core";
import type { ContyResult } from "../../client/types";
import { PUBLIC_API } from "../constants";
import { byTotal, paginate, paginateBy, paginateOffset } from "../pagination";
import { createWriter } from "../request";
import type { Transport } from "../types";
import { segment } from "../url";
import { createCampaignCoupons } from "./coupons";
import { createCampaignCreators } from "./creators";
import { createCampaignResults } from "./results";
import type {
  CampaignExportJson,
  CampaignsResource,
  ExportCampaignParams,
  ListCampaignBriefingsParams,
  ListCampaignItemsParams,
  ListCampaignsParams,
} from "./types";

export function createCampaigns(transport: Transport, randomId: RandomId): CampaignsResource {
  const path = (id: string, suffix = "") => `/campaigns/${segment(id)}${suffix}`;

  const list: CampaignsResource["list"] = (params: ListCampaignsParams = {}) =>
    transport.request({ method: "GET", path: "/campaigns", query: params });

  const items: CampaignsResource["items"] = (id, params: ListCampaignItemsParams) =>
    transport.request({ method: "GET", path: path(id, "/items"), query: params });

  const briefings: CampaignsResource["briefings"] = (
    id,
    params: ListCampaignBriefingsParams = {},
  ) => transport.request({ method: "GET", path: path(id, "/briefings"), query: params });

  const { optional, required } = createWriter(transport, randomId);

  const suggestions: CampaignsResource["suggestions"] = (id, params = {}) =>
    transport.request({ method: "GET", path: path(id, "/suggestions"), query: params });

  const tracking: CampaignsResource["tracking"] = (id, params = {}) =>
    transport.request({ method: "GET", path: path(id, "/tracking"), query: params });

  const creatorInvoices: CampaignsResource["creatorInvoices"] = (id, params = {}) =>
    transport.request({ method: "GET", path: path(id, "/creator-invoices"), query: params });

  function exportStage(
    id: string,
    params: ExportCampaignParams & { format: "json" },
  ): Promise<ContyResult<CampaignExportJson>>;
  function exportStage(
    id: string,
    params: ExportCampaignParams & { format?: "csv" },
  ): Promise<ContyResult<string>>;
  function exportStage(
    id: string,
    params: ExportCampaignParams & { format?: "csv" | "json" },
  ): Promise<ContyResult<CampaignExportJson | string>> {
    return transport.request({
      method: "GET",
      path: path(id, "/export"),
      query: params,
      accept: params.format === "json" ? undefined : PUBLIC_API.csvAccept,
    });
  }

  return {
    creators: createCampaignCreators(transport, randomId),
    coupons: createCampaignCoupons(transport, randomId),
    results: createCampaignResults(transport),
    aiRubric: {
      get: (id) => transport.request({ method: "GET", path: path(id, "/ai-rubric") }),
      set: (id, body, options) => optional("PUT", path(id, "/ai-rubric"), body, options),
    },
    shortLinks: {
      create: (id, body, options) => required("POST", path(id, "/short-links"), body, options),
    },
    export: exportStage,
    counts: (id, params = {}) =>
      transport.request({ method: "GET", path: path(id, "/counts"), query: params }),
    segments: (id, params) =>
      transport.request({ method: "GET", path: path(id, "/segments"), query: params }),
    suggestions,
    suggestionsAll: (id, params = {}) =>
      paginateOffset(
        (page) => suggestions(id, page),
        params,
        (page, offset) => byTotal(page.items, page.total, offset),
      ),
    tracking,
    trackingAll: (id, params = {}) =>
      paginateBy(
        (page) => tracking(id, page),
        params,
        (page) => page.creators,
      ),
    setTrackingDestination: (id, body, options) =>
      optional("PUT", path(id, "/tracking/destination"), body, options),
    creatorInvoices,
    creatorInvoicesAll: (id, params = {}) => paginate((page) => creatorInvoices(id, page), params),
    syncMetrics: (id, options) => optional("POST", path(id, "/sync-metrics"), undefined, options),
    syncMetricsJob: (id, jobId) =>
      transport.request({
        method: "GET",
        path: path(id, `/sync-metrics/jobs/${segment(jobId)}`),
      }),
    list,
    listAll: (params = {}) => paginate(list, params),
    get: (id) => transport.request({ method: "GET", path: path(id) }),
    stages: (id, params = {}) =>
      transport.request({ method: "GET", path: path(id, "/stages"), query: params }),
    items,
    itemsAll: (id, params) => paginate((page) => items(id, page), params),
    validate: (body) => transport.request({ method: "POST", path: "/campaigns/validate", body }),
    create: (body, options) => required("POST", "/campaigns", body, options),
    update: (id, body, options) => optional("PATCH", path(id), body, options),
    setStatus: (id, body, options) => optional("POST", path(id, "/status"), body, options),
    remove: (id) => transport.request({ method: "DELETE", path: path(id) }),
    renew: (id, body, options) => required("POST", path(id, "/renew"), body, options),
    publishCost: (id) => transport.request({ method: "GET", path: path(id, "/publish-cost") }),
    briefings,
    briefingsAll: (id, params = {}) => paginate((page) => briefings(id, page), params),
    proposalSuggestions: (params = {}) =>
      transport.request({ method: "GET", path: "/campaigns/proposal-suggestions", query: params }),
    attachBriefingFile: (id, body, options) =>
      required("POST", path(id, "/briefings/attachments"), body, options),
  };
}
