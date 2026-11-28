import { paginate } from "../pagination";
import type { Transport } from "../types";
import type { BrandsResource, ListBrandsParams } from "./types";

export function createBrands(transport: Transport): BrandsResource {
  const list: BrandsResource["list"] = (params: ListBrandsParams = {}) =>
    transport.request({ method: "GET", path: "/brands", query: params });
  return { list, listAll: (params = {}) => paginate(list, params) };
}
