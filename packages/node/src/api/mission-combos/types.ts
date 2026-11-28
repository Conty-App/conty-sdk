import type { ContyResult } from "../../client/types";
import type { components } from "../generated/openapi";
import type { RequestOptions } from "../types";

type Schemas = components["schemas"];

export type MissionComboStatusBody = Schemas["MissionComboStatusBody"];
export type MissionComboResult = Schemas["MissionComboResult"];

export interface MissionCombosResource {
  setStatus(
    id: string,
    body: MissionComboStatusBody,
    options?: RequestOptions,
  ): Promise<ContyResult<MissionComboResult>>;
}
