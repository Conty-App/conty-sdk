import type { RandomId } from "@conty/core";
import { createWriter } from "../request";
import type { Transport } from "../types";
import { segment } from "../url";
import type { MissionsResource } from "./types";

export function createMissions(transport: Transport, randomId: RandomId): MissionsResource {
  const { optional, required } = createWriter(transport, randomId);
  const path = (id: string, suffix = "") => `/missions/${segment(id)}${suffix}`;
  const read = <T>(url: string, query?: object) =>
    transport.request<T>({ method: "GET", path: url, query });

  return {
    comments: {
      list: (id, params = {}) => read(path(id, "/comments"), params),
      create: (id, body, options) => required("POST", path(id, "/comments"), body, options),
    },
    get: (id) => read(path(id)),
    approve: (id, body, options) => optional("POST", path(id, "/approve"), body, options),
    requestChanges: (id, body, options) =>
      optional("POST", path(id, "/request-changes"), body, options),
    reject: (id, body, options) => optional("POST", path(id, "/reject"), body, options),
    reviewAsset: (id, asset, body, options) =>
      optional("POST", path(id, `/assets/${segment(asset)}/review`), body, options),
    setAssetVersion: (id, body, options) =>
      optional("PATCH", path(id, "/asset-version"), body, options),
    setDeadline: (id, body, options) => optional("PATCH", path(id, "/deadline"), body, options),
    send: (id, body, options) => optional("POST", path(id, "/send"), body, options),
    restore: (id, body, options) => optional("POST", path(id, "/restore"), body, options),
    reinviteEligibility: (id) => read(path(id, "/reinvite-eligibility")),
    reinvite: (id, body, options) => required("POST", path(id, "/reinvite"), body, options),
    remove: (id) => transport.request({ method: "DELETE", path: path(id) }),
    approvePending: (body, options) => required("POST", "/missions/approve-pending", body, options),
    bulkStatus: (campaignId, body, options) =>
      optional("POST", `/campaigns/${segment(campaignId)}/missions/bulk-status`, body, options),
    bulkDeadline: (body, options) => required("POST", "/missions/bulk/deadline", body, options),
    bulkSend: (body, options) => required("POST", "/missions/bulk/send", body, options),
    bulkRemove: (body, options) => required("POST", "/missions/bulk/remove", body, options),
    shipProduct: (id, body, options) =>
      optional("POST", path(id, "/product-shipment"), body, options),
    productShipment: (id) => read(path(id, "/product-shipment")),
    setPostUrl: (id, body, options) => optional("PUT", path(id, "/post-url"), body, options),
    setPostedAt: (id, body, options) => optional("PUT", path(id, "/posted-at"), body, options),
    acceptPostCheck: (id, body, options) =>
      optional("POST", path(id, "/post-check/accept"), body, options),
    createCoupon: (id, body, options) => required("POST", path(id, "/coupon"), body, options),
    notify: (id, body, options) => optional("POST", path(id, "/notify"), body, options),
    syncMetrics: (id, options) => optional("POST", path(id, "/sync-metrics"), undefined, options),
    scriptFile: (id, params = {}) => read(path(id, "/script-file"), params),
    deliveryDownload: (id) => read(path(id, "/delivery-download")),
  };
}
