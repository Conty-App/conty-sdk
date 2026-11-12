import { RETRY, withDeps } from "@conty/core";
import { clampRetries, positiveMs } from "../client/options";
import { ContyError } from "../errors/errors";
import { sleep } from "../transport/retry";
import { createApplications } from "./applications/applications";
import { createBulkJobs } from "./bulk-jobs/bulk-jobs";
import { createCampaigns } from "./campaigns/campaigns";
import { PUBLIC_API } from "./constants";
import { createConversionEvents } from "./conversion-events/conversion-events";
import { createMe } from "./me/me";
import { createMissionCombos } from "./mission-combos/mission-combos";
import { createMissions } from "./missions/missions";
import { createPostChecks } from "./post-checks/post-checks";
import { createTransport } from "./transport";
import type { ContyApi, ContyApiOptions } from "./types";
import { createUploads } from "./uploads/uploads";

function isApiKey(key: unknown): key is string {
  return typeof key === "string" && key.startsWith(PUBLIC_API.keyPrefix);
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
  return {
    campaigns: createCampaigns(transport, deps.randomId),
    applications: createApplications(transport, deps.randomId),
    missions: createMissions(transport, deps.randomId),
    missionCombos: createMissionCombos(transport),
    bulkJobs: createBulkJobs(transport, deps.clock, wait, options.onError),
    postChecks: createPostChecks(transport, deps.randomId),
    conversionEvents: createConversionEvents(transport, deps.randomId),
    uploads: createUploads(transport, deps.randomId),
    me: createMe(transport),
  };
}
