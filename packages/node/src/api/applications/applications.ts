import type { RandomId } from "@conty/core";
import type { Transport } from "../types";
import { segment } from "../url";
import type { ApplicationsResource } from "./types";

export function createApplications(transport: Transport, randomId: RandomId): ApplicationsResource {
  const path = (campaignId: string, suffix: string) =>
    `/campaigns/${segment(campaignId)}/applications${suffix}`;
  const item = (campaignId: string, applicationId: string, action: string) =>
    path(campaignId, `/${segment(applicationId)}/${action}`);

  return {
    approve: (campaignId, applicationId, body, options) =>
      transport.request({
        method: "POST",
        path: item(campaignId, applicationId, "approve"),
        body,
        idempotencyKey: options?.idempotencyKey,
      }),
    reject: (campaignId, applicationId, body, options) =>
      transport.request({
        method: "POST",
        path: item(campaignId, applicationId, "reject"),
        body,
        idempotencyKey: options?.idempotencyKey,
      }),
    restore: (campaignId, applicationId, body, options) =>
      transport.request({
        method: "POST",
        path: item(campaignId, applicationId, "restore"),
        body,
        idempotencyKey: options?.idempotencyKey,
      }),
    bulk: (campaignId, body, options) =>
      transport.request({
        method: "POST",
        path: path(campaignId, "/bulk"),
        body,
        idempotencyKey: options?.idempotencyKey ?? randomId(),
      }),
    setProposedDeadline: (campaignId, applicationId, body, options) =>
      transport.request({
        method: "PATCH",
        path: item(campaignId, applicationId, "proposed-deadline"),
        body,
        idempotencyKey: options?.idempotencyKey,
      }),
    setProposedAmount: (campaignId, applicationId, body, options) =>
      transport.request({
        method: "PATCH",
        path: item(campaignId, applicationId, "proposed-amount"),
        body,
        idempotencyKey: options?.idempotencyKey,
      }),
  };
}
