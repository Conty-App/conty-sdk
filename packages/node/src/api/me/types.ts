import type { ContyResult } from "../../client/types";
import type { components } from "../generated/openapi";

export type Me = components["schemas"]["Me"];
export type ApiKeyScope = Me["api_key"]["scopes"][number];
export type CampaignModel = Me["campaign_model"];

export interface MeResource {
  get(): Promise<ContyResult<Me>>;
}
