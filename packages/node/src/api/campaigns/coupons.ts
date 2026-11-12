import type { RandomId } from "@conty/core";
import { paginateOffset } from "../pagination";
import { createWriter } from "../request";
import type { Transport } from "../types";
import { segment } from "../url";
import type { CampaignCouponsResource } from "./types";

export function createCampaignCoupons(
  transport: Transport,
  randomId: RandomId,
): CampaignCouponsResource {
  const { required } = createWriter(transport, randomId);
  const path = (id: string, suffix: string) => `/campaigns/${segment(id)}${suffix}`;

  const list: CampaignCouponsResource["pool"]["list"] = (id, params = {}) =>
    transport.request({ method: "GET", path: path(id, "/coupon-pool"), query: params });
  const sales: CampaignCouponsResource["sales"] = (id, params = {}) =>
    transport.request({ method: "GET", path: path(id, "/coupon-sales"), query: params });

  return {
    pool: {
      list,
      listAll: (id, params = {}) =>
        paginateOffset(
          (page) => list(id, page),
          params,
          (page) => ({
            items: page.data,
            hasMore: page.has_more,
          }),
        ),
      add: (id, body, options) => required("POST", path(id, "/coupon-pool"), body, options),
    },
    bulk: (id, body, options) => required("POST", path(id, "/coupons/bulk"), body, options),
    setCommissionBudget: (id, body, options) =>
      required("POST", path(id, "/coupon-commission/budget"), body, options),
    sales,
    salesAll: (id, params = {}) =>
      paginateOffset(
        (page) => sales(id, page),
        params,
        (page) => ({
          items: page.data,
          hasMore: page.has_more,
        }),
      ),
  };
}
