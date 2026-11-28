import { paginate } from "../pagination";
import type { Transport } from "../types";
import type { CreatorsResource, SearchCreatorsParams } from "./types";

export function createCreators(transport: Transport): CreatorsResource {
  const search: CreatorsResource["search"] = (params: SearchCreatorsParams = {}) =>
    transport.request({ method: "GET", path: "/creators/search", query: params });
  return { search, searchAll: (params = {}) => paginate(search, params) };
}
