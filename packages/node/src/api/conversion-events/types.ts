import type { ContyResult } from "../../client/types";
import type { components } from "../generated/openapi";
import type { RequestOptions } from "../types";

export type ConversionEventsBody = components["schemas"]["ConversionEventsBody"];
export type ConversionEventsResult = components["schemas"]["ConversionEventsResult"];

export interface ConversionEventsResource {
  set(
    body: ConversionEventsBody,
    options?: RequestOptions,
  ): Promise<ContyResult<ConversionEventsResult>>;
}
