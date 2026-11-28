import type { ContyResult } from "../../client/types";
import type { components } from "../generated/openapi";
import type { RequestOptions } from "../types";

export type AcceptPostChecksBody = components["schemas"]["AcceptPostChecksBody"];
export type AcceptPostChecksResult = components["schemas"]["AcceptPostChecksResult"];

export interface PostChecksResource {
  accept(
    body: AcceptPostChecksBody,
    options?: RequestOptions,
  ): Promise<ContyResult<AcceptPostChecksResult>>;
}
