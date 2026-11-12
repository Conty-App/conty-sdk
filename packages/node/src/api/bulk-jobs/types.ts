import type { ContyResult } from "../../client/types";
import type { components, paths } from "../generated/openapi";

type BulkFailure = components["schemas"]["BulkFailure"];

export type BulkJob = components["schemas"]["BulkJob"];
export type BulkJobStatus = BulkJob["status"];
export type GetBulkJobParams = NonNullable<paths["/bulk-jobs/{id}"]["get"]["parameters"]["query"]>;

export interface WaitBulkJobOptions {
  intervalMs?: number;
  timeoutMs?: number;
}

export interface BulkJobsResource {
  get(id: string, params?: GetBulkJobParams): Promise<ContyResult<BulkJob>>;
  failuresAll(id: string, params?: GetBulkJobParams): AsyncIterable<BulkFailure>;
  wait(id: string, options?: WaitBulkJobOptions): Promise<ContyResult<BulkJob>>;
}
