import type { ContyResult } from "../../client/types";
import type { components } from "../generated/openapi";
import type { QueryOf } from "../types";

export type Brand = components["schemas"]["Brand"];
export type BrandList = components["schemas"]["BrandList"];
export type BrandStatus = Brand["status"];
export type ListBrandsParams = QueryOf<"/brands", "get">;

export interface BrandsResource {
  list(params?: ListBrandsParams): Promise<ContyResult<BrandList>>;
  listAll(params?: ListBrandsParams): AsyncIterable<Brand>;
}
