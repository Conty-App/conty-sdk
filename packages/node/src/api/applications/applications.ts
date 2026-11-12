import type { RandomId } from "@conty/core";
import { createWriter } from "../request";
import type { Transport } from "../types";
import { segment } from "../url";
import type { ApplicationsResource } from "./types";

export function createApplications(transport: Transport, randomId: RandomId): ApplicationsResource {
  const { optional, required } = createWriter(transport, randomId);
  const path = (campaignId: string, suffix: string) =>
    `/campaigns/${segment(campaignId)}/applications${suffix}`;
  const item = (campaignId: string, applicationId: string, action: string) =>
    path(campaignId, `/${segment(applicationId)}/${action}`);

  return {
    approve: (campaignId, applicationId, body, options) =>
      optional("POST", item(campaignId, applicationId, "approve"), body, options),
    reject: (campaignId, applicationId, body, options) =>
      optional("POST", item(campaignId, applicationId, "reject"), body, options),
    restore: (campaignId, applicationId, body, options) =>
      optional("POST", item(campaignId, applicationId, "restore"), body, options),
    bulk: (campaignId, body, options) => required("POST", path(campaignId, "/bulk"), body, options),
    setProposedDeadline: (campaignId, applicationId, body, options) =>
      optional("PATCH", item(campaignId, applicationId, "proposed-deadline"), body, options),
    setProposedAmount: (campaignId, applicationId, body, options) =>
      optional("PATCH", item(campaignId, applicationId, "proposed-amount"), body, options),
  };
}
