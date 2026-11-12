import type { RandomId } from "@conty/core";
import type { Transport } from "../types";
import { segment } from "../url";
import type { CampaignCreatorsResource } from "./types";

export function createCampaignCreators(
  transport: Transport,
  randomId: RandomId,
): CampaignCreatorsResource {
  const path = (campaignId: string, suffix: string) =>
    `/campaigns/${segment(campaignId)}/creators${suffix}`;
  const creator = (campaignId: string, creatorId: string, field: string) =>
    path(campaignId, `/${segment(creatorId)}/${field}`);

  return {
    setScopeOption: (campaignId, creatorId, body, options) =>
      transport.request({
        method: "PATCH",
        path: creator(campaignId, creatorId, "scope-option"),
        body,
        idempotencyKey: options?.idempotencyKey,
      }),
    setBriefing: (campaignId, creatorId, body, options) =>
      transport.request({
        method: "PATCH",
        path: creator(campaignId, creatorId, "briefing"),
        body,
        idempotencyKey: options?.idempotencyKey,
      }),
    setScopeAmount: (campaignId, creatorId, body, options) =>
      transport.request({
        method: "PATCH",
        path: creator(campaignId, creatorId, "scope-amount"),
        body,
        idempotencyKey: options?.idempotencyKey,
      }),
    bulkExclude: (campaignId, body, options) =>
      transport.request({
        method: "POST",
        path: path(campaignId, "/bulk/exclude"),
        body,
        idempotencyKey: options?.idempotencyKey ?? randomId(),
      }),
  };
}
