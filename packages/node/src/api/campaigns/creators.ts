import type { RandomId } from "@conty/core";
import { createWriter } from "../request";
import type { Transport } from "../types";
import { segment } from "../url";
import type { CampaignCreatorsResource } from "./types";

export function createCampaignCreators(
  transport: Transport,
  randomId: RandomId,
): CampaignCreatorsResource {
  const { optional, required } = createWriter(transport, randomId);
  const path = (campaignId: string, suffix: string) =>
    `/campaigns/${segment(campaignId)}/creators${suffix}`;
  const creator = (campaignId: string, creatorId: string, field: string) =>
    path(campaignId, `/${segment(creatorId)}/${field}`);

  return {
    setScopeOption: (campaignId, creatorId, body, options) =>
      optional("PATCH", creator(campaignId, creatorId, "scope-option"), body, options),
    setBriefing: (campaignId, creatorId, body, options) =>
      optional("PATCH", creator(campaignId, creatorId, "briefing"), body, options),
    setScopeAmount: (campaignId, creatorId, body, options) =>
      optional("PATCH", creator(campaignId, creatorId, "scope-amount"), body, options),
    bulkExclude: (campaignId, body, options) =>
      required("POST", path(campaignId, "/bulk/exclude"), body, options),
  };
}
