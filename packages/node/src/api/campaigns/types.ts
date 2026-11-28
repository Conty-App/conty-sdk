import type { ContyResult } from "../../client/types";
import type { components, paths } from "../generated/openapi";
import type { QueryOf, RequestOptions } from "../types";

type Schemas = components["schemas"];

export type Campaign = Schemas["Campaign"];
export type CampaignDetail = Schemas["CampaignDetail"];
export type CampaignList = Schemas["CampaignList"];
export type CampaignStatus = Schemas["CampaignStatus"];
export type CampaignPaymentType = NonNullable<Schemas["PaymentType"]>;
export type BoardStages = Schemas["BoardStages"];
export type BoardStage = Schemas["BoardStage"];
export type StageId = Schemas["StageId"];
export type BoardItem = Schemas["BoardItem"];
export type BoardItemList = Schemas["BoardItemList"];

type ListQuery = NonNullable<paths["/campaigns"]["get"]["parameters"]["query"]>;
type StagesQuery = NonNullable<paths["/campaigns/{id}/stages"]["get"]["parameters"]["query"]>;
type ItemsQuery = NonNullable<paths["/campaigns/{id}/items"]["get"]["parameters"]["query"]>;
type BriefingsQuery = NonNullable<paths["/campaigns/{id}/briefings"]["get"]["parameters"]["query"]>;
type SuggestionsQuery = NonNullable<
  paths["/campaigns/proposal-suggestions"]["get"]["parameters"]["query"]
>;

export type ListCampaignsParams = Omit<ListQuery, "status"> & {
  status?: CampaignStatus | readonly CampaignStatus[];
};
export type CampaignStagesParams = StagesQuery;
export type ListCampaignItemsParams = ItemsQuery;

export type CreateCampaignBody = Schemas["CreateCampaignBody"];
export type ValidateCampaignBody = Schemas["ValidateCampaignBody"];
export type UpdateCampaignBody = Schemas["UpdateCampaignBody"];
export type CampaignDeliverable = Schemas["CampaignDeliverable"];
export type CampaignDeliverableEdit = Schemas["CampaignDeliverableEdit"];
export type CampaignScopeOptionInput = Schemas["CampaignScopeOptionInput"];
export type CampaignBriefingInput = Schemas["CampaignBriefingInput"];
export type BriefingAttachmentInput = Schemas["BriefingAttachmentInput"];
export type CampaignValidation = Schemas["CampaignValidation"];
export type CampaignValidationIssue = Schemas["CampaignValidationIssue"];
export type SetCampaignStatusBody = Schemas["SetCampaignStatusBody"];
export type RenewCampaignBody = Schemas["RenewCampaignBody"];
export type RenewJob = Schemas["RenewJob"];
export type PublishCost = Schemas["PublishCost"];
export type CampaignBriefing = Schemas["CampaignBriefing"];
export type CampaignBriefingList = Schemas["CampaignBriefingList"];
export type ProposalSuggestions = Schemas["ProposalSuggestions"];
export type AttachBriefingFileBody = Schemas["AttachBriefingFileBody"];
export type BriefingAttachmentResult = Schemas["BriefingAttachmentResult"];

export type ListCampaignBriefingsParams = BriefingsQuery;
export type ProposalSuggestionsParams = SuggestionsQuery;

export type CreatorScopeOptionBody = Schemas["CreatorScopeOptionBody"];
export type CreatorScopeOptionChange = Schemas["CreatorScopeOptionChange"];
export type CreatorBriefingBody = Schemas["CreatorBriefingBody"];
export type CreatorBriefingChange = Schemas["CreatorBriefingChange"];
export type CreatorScopeAmountChange = Schemas["CreatorScopeAmountChange"];
export type ExcludeCreatorsBody = Schemas["ExcludeCreatorsBody"];
export type DeliveryNetwork = Schemas["DeliveryNetwork"];

export interface CampaignCreatorsResource {
  setScopeOption(
    campaignId: string,
    creatorId: string,
    body: CreatorScopeOptionBody,
    options?: RequestOptions,
  ): Promise<ContyResult<CreatorScopeOptionChange>>;
  setBriefing(
    campaignId: string,
    creatorId: string,
    body: CreatorBriefingBody,
    options?: RequestOptions,
  ): Promise<ContyResult<CreatorBriefingChange>>;
  setScopeAmount(
    campaignId: string,
    creatorId: string,
    body: Schemas["AmountBody"],
    options?: RequestOptions,
  ): Promise<ContyResult<CreatorScopeAmountChange>>;
  bulkExclude(
    campaignId: string,
    body: ExcludeCreatorsBody,
    options?: RequestOptions,
  ): Promise<ContyResult<Schemas["BulkJobAccepted"]>>;
}

export type CouponPoolPage = Schemas["CouponPoolPage"];
export type CouponPoolEntry = CouponPoolPage["data"][number];
export type ListCouponPoolParams = QueryOf<"/campaigns/{id}/coupon-pool", "get">;
export type CouponPoolBody = Schemas["CouponPoolBody"];
export type CouponPoolResult = Schemas["CouponPoolResult"];
export type CouponBulkBody = Schemas["CouponBulkBody"];
export type CouponBulkResult = Schemas["CouponBulkResult"];
export type CommissionBudgetBody = Schemas["CommissionBudgetBody"];
export type CommissionBudgetResult = Schemas["CommissionBudgetResult"];
export type CampaignCouponSales = Schemas["CampaignCouponSales"];
export type CampaignCouponSale = CampaignCouponSales["data"][number];
export type ListCouponSalesParams = QueryOf<"/campaigns/{id}/coupon-sales", "get">;

export interface CampaignCouponPoolResource {
  list(id: string, params?: ListCouponPoolParams): Promise<ContyResult<CouponPoolPage>>;
  listAll(id: string, params?: ListCouponPoolParams): AsyncIterable<CouponPoolEntry>;
  add(
    id: string,
    body: CouponPoolBody,
    options?: RequestOptions,
  ): Promise<ContyResult<CouponPoolResult>>;
}

export interface CampaignCouponsResource {
  pool: CampaignCouponPoolResource;
  bulk(
    id: string,
    body: CouponBulkBody,
    options?: RequestOptions,
  ): Promise<ContyResult<CouponBulkResult>>;
  setCommissionBudget(
    id: string,
    body: CommissionBudgetBody,
    options?: RequestOptions,
  ): Promise<ContyResult<CommissionBudgetResult>>;
  sales(id: string, params?: ListCouponSalesParams): Promise<ContyResult<CampaignCouponSales>>;
  salesAll(id: string, params?: ListCouponSalesParams): AsyncIterable<CampaignCouponSale>;
}

export type ResultsParams = QueryOf<"/campaigns/{id}/results", "get">;
export type ResultsOverview = Schemas["ResultsOverview"];
export type ResultsTimeseries = Schemas["ResultsTimeseries"];
export type ResultsCreators = Schemas["ResultsCreators"];
export type ResultsCreator = Schemas["ResultsCreator"];
export type ResultsCreatorsParams = QueryOf<"/campaigns/{id}/results/creators", "get">;
export type ResultsDeliveries = Schemas["ResultsDeliveries"];
export type ResultsDeliveriesParams = QueryOf<
  "/campaigns/{id}/results/creators/{creator_id}/deliveries",
  "get"
>;
export type ResultsTraffic = Schemas["ResultsTraffic"];
export type ResultsTrafficParams = QueryOf<"/campaigns/{id}/results/traffic", "get">;
export type ResultsTrafficEvents = Schemas["ResultsTrafficEvents"];
export type ConversionEvent = Schemas["ConversionEvent"];
export type ResultsTrafficEventsParams = QueryOf<"/campaigns/{id}/results/traffic/events", "get">;

export interface CampaignResultsResource {
  overview(id: string, params?: ResultsParams): Promise<ContyResult<ResultsOverview>>;
  timeseries(id: string, params?: ResultsParams): Promise<ContyResult<ResultsTimeseries>>;
  creators(id: string, params?: ResultsCreatorsParams): Promise<ContyResult<ResultsCreators>>;
  creatorsAll(id: string, params?: ResultsCreatorsParams): AsyncIterable<ResultsCreator>;
  deliveries(
    id: string,
    creatorId: string,
    params?: ResultsDeliveriesParams,
  ): Promise<ContyResult<ResultsDeliveries>>;
  traffic(id: string, params?: ResultsTrafficParams): Promise<ContyResult<ResultsTraffic>>;
  trafficEvents(
    id: string,
    params?: ResultsTrafficEventsParams,
  ): Promise<ContyResult<ResultsTrafficEvents>>;
  trafficEventsAll(id: string, params?: ResultsTrafficEventsParams): AsyncIterable<ConversionEvent>;
}

export type CampaignRubric = Schemas["CampaignRubric"];
export type BlockRubric = Schemas["BlockRubric"];
export type UpdateRubricBody = Schemas["UpdateRubricBody"];

export interface CampaignAiRubricResource {
  get(id: string): Promise<ContyResult<CampaignRubric>>;
  set(
    id: string,
    body: UpdateRubricBody,
    options?: RequestOptions,
  ): Promise<ContyResult<BlockRubric>>;
}

export type ShortLinkBody = Schemas["ShortLinkBody"];
export type ShortLink = Schemas["ShortLink"];

export interface CampaignShortLinksResource {
  create(
    id: string,
    body: ShortLinkBody,
    options?: RequestOptions,
  ): Promise<ContyResult<ShortLink>>;
}

type ExportQuery = QueryOf<"/campaigns/{id}/export", "get">;
export type ExportCampaignParams = Omit<ExportQuery, "fields" | "format"> & {
  fields?: string | readonly string[];
};
export type CampaignExportJson = Schemas["CampaignExportJson"];
export type CampaignCounts = Schemas["CampaignCounts"];
export type CampaignCountsParams = QueryOf<"/campaigns/{id}/counts", "get">;
export type Segments = Schemas["Segments"];
export type SegmentsParams = QueryOf<"/campaigns/{id}/segments", "get">;
export type Suggestions = Schemas["Suggestions"];
export type Suggestion = Schemas["Suggestion"];
export type SuggestionsParams = QueryOf<"/campaigns/{id}/suggestions", "get">;
export type Tracking = Schemas["Tracking"];
export type TrackingCreator = Schemas["TrackingCreator"];
export type TrackingParams = QueryOf<"/campaigns/{id}/tracking", "get">;
export type TrackingDestinationBody = Schemas["TrackingDestinationBody"];
export type TrackingDestination = Schemas["TrackingDestination"];
export type CreatorInvoiceList = Schemas["CreatorInvoiceList"];
export type CreatorInvoice = Schemas["CreatorInvoice"];
export type CreatorInvoicesParams = QueryOf<"/campaigns/{id}/creator-invoices", "get">;
export type CampaignMetricsSync = Schemas["CampaignMetricsSync"];
export type MetricsSyncJob = Schemas["MetricsSyncJob"];

export interface CampaignsResource {
  creators: CampaignCreatorsResource;
  coupons: CampaignCouponsResource;
  results: CampaignResultsResource;
  aiRubric: CampaignAiRubricResource;
  shortLinks: CampaignShortLinksResource;
  export(
    id: string,
    params: ExportCampaignParams & { format: "json" },
  ): Promise<ContyResult<CampaignExportJson>>;
  export(
    id: string,
    params: ExportCampaignParams & { format?: "csv" },
  ): Promise<ContyResult<string>>;
  counts(id: string, params?: CampaignCountsParams): Promise<ContyResult<CampaignCounts>>;
  segments(id: string, params: SegmentsParams): Promise<ContyResult<Segments>>;
  suggestions(id: string, params?: SuggestionsParams): Promise<ContyResult<Suggestions>>;
  suggestionsAll(id: string, params?: SuggestionsParams): AsyncIterable<Suggestion>;
  tracking(id: string, params?: TrackingParams): Promise<ContyResult<Tracking>>;
  trackingAll(id: string, params?: TrackingParams): AsyncIterable<TrackingCreator>;
  setTrackingDestination(
    id: string,
    body: TrackingDestinationBody,
    options?: RequestOptions,
  ): Promise<ContyResult<TrackingDestination>>;
  creatorInvoices(
    id: string,
    params?: CreatorInvoicesParams,
  ): Promise<ContyResult<CreatorInvoiceList>>;
  creatorInvoicesAll(id: string, params?: CreatorInvoicesParams): AsyncIterable<CreatorInvoice>;
  syncMetrics(id: string, options?: RequestOptions): Promise<ContyResult<CampaignMetricsSync>>;
  syncMetricsJob(id: string, jobId: string): Promise<ContyResult<MetricsSyncJob>>;
  list(params?: ListCampaignsParams): Promise<ContyResult<CampaignList>>;
  listAll(params?: ListCampaignsParams): AsyncIterable<Campaign>;
  get(id: string): Promise<ContyResult<CampaignDetail>>;
  stages(id: string, params?: CampaignStagesParams): Promise<ContyResult<BoardStages>>;
  items(id: string, params: ListCampaignItemsParams): Promise<ContyResult<BoardItemList>>;
  itemsAll(id: string, params: ListCampaignItemsParams): AsyncIterable<BoardItem>;
  validate(body: ValidateCampaignBody): Promise<ContyResult<CampaignValidation>>;
  create(body: CreateCampaignBody, options?: RequestOptions): Promise<ContyResult<CampaignDetail>>;
  update(
    id: string,
    body: UpdateCampaignBody,
    options?: RequestOptions,
  ): Promise<ContyResult<CampaignDetail>>;
  setStatus(
    id: string,
    body: SetCampaignStatusBody,
    options?: RequestOptions,
  ): Promise<ContyResult<CampaignDetail>>;
  remove(id: string): Promise<ContyResult<null>>;
  renew(
    id: string,
    body: RenewCampaignBody,
    options?: RequestOptions,
  ): Promise<ContyResult<CampaignDetail | RenewJob>>;
  publishCost(id: string): Promise<ContyResult<PublishCost>>;
  briefings(
    id: string,
    params?: ListCampaignBriefingsParams,
  ): Promise<ContyResult<CampaignBriefingList>>;
  briefingsAll(id: string, params?: ListCampaignBriefingsParams): AsyncIterable<CampaignBriefing>;
  proposalSuggestions(
    params?: ProposalSuggestionsParams,
  ): Promise<ContyResult<ProposalSuggestions>>;
  attachBriefingFile(
    id: string,
    body: AttachBriefingFileBody,
    options?: RequestOptions,
  ): Promise<ContyResult<BriefingAttachmentResult>>;
}
