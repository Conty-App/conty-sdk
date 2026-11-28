import type { ContyResult } from "../../client/types";
import type { components } from "../generated/openapi";
import type { RequestOptions } from "../types";

type Schemas = components["schemas"];

export type BoardApplicationItem = Schemas["BoardApplicationItem"];
export type ApproveApplicationBody = Schemas["ApproveApplicationBody"];
export type RejectApplicationBody = Schemas["RejectApplicationBody"];
export type RestoreApplicationBody = Schemas["RestoreApplicationBody"];
export type BulkApplicationsBody = Schemas["BulkApplicationsBody"];
export type BulkRejectApplicationsResult = Schemas["BulkRejectApplicationsResult"];
export type ProposedDeadlineBody = Schemas["ProposedDeadlineBody"];
export type AmountBody = Schemas["AmountBody"];
export type BulkJobAccepted = Schemas["BulkJobAccepted"];
export type BulkFailure = Schemas["BulkFailure"];

type ApplicationResult = Promise<ContyResult<BoardApplicationItem>>;

export interface ApplicationsResource {
  approve(
    campaignId: string,
    applicationId: string,
    body?: ApproveApplicationBody,
    options?: RequestOptions,
  ): ApplicationResult;
  reject(
    campaignId: string,
    applicationId: string,
    body?: RejectApplicationBody,
    options?: RequestOptions,
  ): ApplicationResult;
  restore(
    campaignId: string,
    applicationId: string,
    body?: RestoreApplicationBody,
    options?: RequestOptions,
  ): ApplicationResult;
  bulk(
    campaignId: string,
    body: BulkApplicationsBody,
    options?: RequestOptions,
  ): Promise<ContyResult<BulkJobAccepted | BulkRejectApplicationsResult>>;
  setProposedDeadline(
    campaignId: string,
    applicationId: string,
    body: ProposedDeadlineBody,
    options?: RequestOptions,
  ): ApplicationResult;
  setProposedAmount(
    campaignId: string,
    applicationId: string,
    body: AmountBody,
    options?: RequestOptions,
  ): ApplicationResult;
}
