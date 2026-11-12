import type { Deps } from "@conty/core";
import type { ContyResult } from "../client/types";
import type { ContyError } from "../errors/errors";
import type { Sleep } from "../transport/types";
import type { ApplicationsResource } from "./applications/types";
import type { BulkJobsResource } from "./bulk-jobs/types";
import type { CampaignsResource } from "./campaigns/types";
import type { ConversionEventsResource } from "./conversion-events/types";
import type { paths } from "./generated/openapi";
import type { MeResource } from "./me/types";
import type { MissionCombosResource } from "./mission-combos/types";
import type { MissionsResource } from "./missions/types";
import type { PostChecksResource } from "./post-checks/types";
import type { UploadsResource } from "./uploads/types";

export interface ContyApiOptions extends Partial<Deps> {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  timeoutMs?: number;
  sleep?: Sleep;
  onError?: (error: ContyError) => void;
}

export type QueryOf<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  parameters: { query?: infer Q };
}
  ? NonNullable<Q>
  : never;

export interface RequestOptions {
  idempotencyKey?: string;
}

export interface Page<T> {
  data: T[];
  has_more: boolean;
  next_cursor: string | null;
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ApiRequest {
  method: HttpMethod;
  path: string;
  query?: object;
  body?: unknown;
  idempotencyKey?: string;
  accept?: string;
}

export interface Transport {
  request<T>(request: ApiRequest): Promise<ContyResult<T>>;
}

export interface ContyApi {
  campaigns: CampaignsResource;
  applications: ApplicationsResource;
  missions: MissionsResource;
  missionCombos: MissionCombosResource;
  bulkJobs: BulkJobsResource;
  postChecks: PostChecksResource;
  conversionEvents: ConversionEventsResource;
  uploads: UploadsResource;
  me: MeResource;
}
