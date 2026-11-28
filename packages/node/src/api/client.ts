import { RETRY, withDeps } from "@conty/core";
import { clampRetries, positiveMs } from "../client/options";
import { ContyError } from "../errors/errors";
import { sleep } from "../transport/retry";
import { createApplications } from "./applications/applications";
import { createBrands } from "./brands/brands";
import { createBulkJobs } from "./bulk-jobs/bulk-jobs";
import { createCampaigns } from "./campaigns/campaigns";
import { PUBLIC_API } from "./constants";
import { createConversionEvents } from "./conversion-events/conversion-events";
import { createCreators } from "./creators/creators";
import { createMe } from "./me/me";
import { createMissionCombos } from "./mission-combos/mission-combos";
import { createMissions } from "./missions/missions";
import { createPostChecks } from "./post-checks/post-checks";
import { createTransport } from "./transport";
import type { ApiRequest, ContyApi, ContyApiOptions, Transport } from "./types";
import { createUploads } from "./uploads/uploads";

function isApiKey(key: unknown): key is string {
  return typeof key === "string" && key.startsWith(PUBLIC_API.keyPrefix);
}

function brandIdOf(brandId: unknown): string {
  if (typeof brandId === "string" && brandId.trim() !== "") return brandId;
  throw new ContyError({
    status: null,
    code: "invalid_brand_id",
    message:
      "brandId must be a non-empty string. List the brands of an agency key with brands.list().",
  });
}

function withBrand(transport: Transport, brandId: string | undefined): Transport {
  if (brandId === undefined) return transport;
  return { request: <T>(request: ApiRequest) => transport.request<T>({ ...request, brandId }) };
}

export function createContyApi(options: ContyApiOptions): ContyApi {
  if (!isApiKey(options?.apiKey)) {
    throw new ContyError({
      status: null,
      code: "invalid_api_key",
      message: `API key must start with ${PUBLIC_API.keyPrefix}. Create one in the panel, under Developers.`,
    });
  }
  const deps = withDeps(options);
  const wait = options.sleep ?? sleep;
  const transport = createTransport({
    apiKey: options.apiKey,
    baseUrl: options.baseUrl ?? PUBLIC_API.baseUrl,
    maxRetries: clampRetries(options.maxRetries),
    timeoutMs: positiveMs(options.timeoutMs, RETRY.timeoutMs),
    deps,
    sleep: wait,
    onError: options.onError,
  });
  const build = (brandId: string | undefined): ContyApi => {
    const scoped = withBrand(transport, brandId);
    return {
      campaigns: createCampaigns(scoped, deps.randomId),
      applications: createApplications(scoped, deps.randomId),
      missions: createMissions(scoped, deps.randomId),
      missionCombos: createMissionCombos(scoped, deps.randomId),
      bulkJobs: createBulkJobs(scoped, deps.clock, wait, options.onError),
      postChecks: createPostChecks(scoped, deps.randomId),
      conversionEvents: createConversionEvents(scoped, deps.randomId),
      uploads: createUploads(scoped, deps.randomId),
      creators: createCreators(scoped),
      brands: createBrands(transport),
      me: createMe(transport),
      forBrand: (next) => build(brandIdOf(next)),
    };
  };
  return build(options.brandId === undefined ? undefined : brandIdOf(options.brandId));
}
