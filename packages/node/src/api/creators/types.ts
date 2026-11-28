import type { ContyResult } from "../../client/types";
import type { components } from "../generated/openapi";
import type { QueryOf } from "../types";

export type CreatorSearchPage = components["schemas"]["CreatorSearchPage"];
export type CreatorSearchItem = components["schemas"]["CreatorSearchItem"];
export type CreatorSearchNetwork = components["schemas"]["CreatorSearchNetwork"];
export type SearchCreatorsParams = QueryOf<"/creators/search", "get">;
export type CreatorSearchSort = NonNullable<SearchCreatorsParams["sort"]>;

export interface CreatorsResource {
  search(params?: SearchCreatorsParams): Promise<ContyResult<CreatorSearchPage>>;
  searchAll(params?: SearchCreatorsParams): AsyncIterable<CreatorSearchItem>;
}
