import type { ContyResult } from "../../client/types";
import type { components, paths } from "../generated/openapi";
import type { QueryOf, RequestOptions } from "../types";

type Schemas = components["schemas"];

export type Mission = Schemas["Mission"];
export type MissionAsset =
  paths["/missions/{id}/assets/{asset}/review"]["post"]["parameters"]["path"]["asset"];
export type ApproveMissionBody = Schemas["ApproveMissionBody"];
export type RequestChangesBody = Schemas["RequestChangesBody"];
export type RejectMissionBody = Schemas["RejectMissionBody"];
export type AssetReviewBody = Schemas["AssetReviewBody"];
export type AssetVersionBody = Schemas["AssetVersionBody"];
export type MissionDeadlineBody = Schemas["MissionDeadlineBody"];
export type SendBriefingBody = Schemas["SendBriefingBody"];
export type MissionDatesBody = Schemas["MissionDatesBody"];
export type ReinviteEligibility = Schemas["ReinviteEligibility"];
export type ApprovePendingBody = Schemas["ApprovePendingBody"];
export type BulkMissionStatusBody = Schemas["BulkMissionStatusBody"];
export type BulkMissionStatusResult = Schemas["BulkMissionStatusResult"];
export type BulkMissionDeadlineBody = Schemas["BulkMissionDeadlineBody"];
export type BulkSendBriefingBody = Schemas["BulkSendBriefingBody"];
export type BulkMissionIdsBody = Schemas["BulkMissionIdsBody"];

export type ProductShipment = Schemas["ProductShipment"];
export type ProductShipmentBody = Schemas["ProductShipmentBody"];
export type ProductShipmentResult = Schemas["ProductShipmentResult"];
export type PostUrlBody = Schemas["PostUrlBody"];
export type PostUrlResult = Schemas["PostUrlResult"];
export type PostedAtBody = Schemas["PostedAtBody"];
export type AcceptPostCheckBody = Schemas["AcceptPostCheckBody"];
export type MissionCouponBody = Schemas["MissionCouponBody"];
export type NotifyMissionBody = Schemas["NotifyMissionBody"];
export type MissionMetricsSync = Schemas["MissionMetricsSync"];
export type ScriptFile = Schemas["ScriptFile"];
export type ScriptFileParams = QueryOf<"/missions/{id}/script-file", "get">;
export type DeliveryDownload = Schemas["DeliveryDownload"];
export type MissionComment = Schemas["MissionComment"];
export type MissionCommentList = Schemas["MissionCommentList"];
export type ListMissionCommentsParams = QueryOf<"/missions/{id}/comments", "get">;
export type CreateMissionCommentBody = Schemas["CreateMissionCommentBody"];

export interface MissionCommentsResource {
  list(id: string, params?: ListMissionCommentsParams): Promise<ContyResult<MissionCommentList>>;
  create(
    id: string,
    body: CreateMissionCommentBody,
    options?: RequestOptions,
  ): Promise<ContyResult<MissionComment>>;
}

type MissionResult = Promise<ContyResult<Mission>>;
type JobResult = Promise<ContyResult<Schemas["BulkJobAccepted"]>>;

export interface MissionsResource {
  comments: MissionCommentsResource;
  get(id: string): MissionResult;
  approve(id: string, body?: ApproveMissionBody, options?: RequestOptions): MissionResult;
  requestChanges(id: string, body: RequestChangesBody, options?: RequestOptions): MissionResult;
  reject(id: string, body: RejectMissionBody, options?: RequestOptions): MissionResult;
  reviewAsset(
    id: string,
    asset: MissionAsset,
    body: AssetReviewBody,
    options?: RequestOptions,
  ): MissionResult;
  setAssetVersion(id: string, body: AssetVersionBody, options?: RequestOptions): MissionResult;
  setDeadline(id: string, body: MissionDeadlineBody, options?: RequestOptions): MissionResult;
  send(id: string, body?: SendBriefingBody, options?: RequestOptions): MissionResult;
  restore(id: string, body?: MissionDatesBody, options?: RequestOptions): MissionResult;
  reinviteEligibility(id: string): Promise<ContyResult<ReinviteEligibility>>;
  reinvite(id: string, body?: MissionDatesBody, options?: RequestOptions): MissionResult;
  remove(id: string): Promise<ContyResult<null>>;
  approvePending(body: ApprovePendingBody, options?: RequestOptions): JobResult;
  bulkStatus(
    campaignId: string,
    body: BulkMissionStatusBody,
    options?: RequestOptions,
  ): Promise<ContyResult<BulkMissionStatusResult>>;
  bulkDeadline(body: BulkMissionDeadlineBody, options?: RequestOptions): JobResult;
  bulkSend(body: BulkSendBriefingBody, options?: RequestOptions): JobResult;
  bulkRemove(body: BulkMissionIdsBody, options?: RequestOptions): JobResult;
  shipProduct(
    id: string,
    body?: ProductShipmentBody,
    options?: RequestOptions,
  ): Promise<ContyResult<ProductShipmentResult>>;
  productShipment(id: string): Promise<ContyResult<ProductShipment>>;
  setPostUrl(
    id: string,
    body: PostUrlBody,
    options?: RequestOptions,
  ): Promise<ContyResult<PostUrlResult>>;
  setPostedAt(id: string, body: PostedAtBody, options?: RequestOptions): MissionResult;
  acceptPostCheck(id: string, body: AcceptPostCheckBody, options?: RequestOptions): MissionResult;
  createCoupon(id: string, body: MissionCouponBody, options?: RequestOptions): MissionResult;
  notify(id: string, body: NotifyMissionBody, options?: RequestOptions): MissionResult;
  syncMetrics(id: string, options?: RequestOptions): Promise<ContyResult<MissionMetricsSync>>;
  scriptFile(id: string, params?: ScriptFileParams): Promise<ContyResult<ScriptFile>>;
  deliveryDownload(id: string): Promise<ContyResult<DeliveryDownload>>;
}
