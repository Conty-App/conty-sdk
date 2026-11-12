import type { Clock } from "@conty/core";
import { positiveMs } from "../../client/options";
import { ContyError } from "../../errors/errors";
import type { Sleep } from "../../transport/types";
import { PUBLIC_API } from "../constants";
import type { Transport } from "../types";
import { segment } from "../url";
import type { BulkJob, BulkJobsResource } from "./types";

const { bulkJob } = PUBLIC_API;

function isFinished(job: BulkJob): boolean {
  return (bulkJob.terminal as readonly string[]).includes(job.status);
}

export function createBulkJobs(
  transport: Transport,
  clock: Clock,
  sleep: Sleep,
  onError?: (error: ContyError) => void,
): BulkJobsResource {
  const get: BulkJobsResource["get"] = (id, params = {}) =>
    transport.request({ method: "GET", path: `/bulk-jobs/${segment(id)}`, query: params });

  return {
    get,
    async wait(id, options = {}) {
      const intervalMs = positiveMs(options.intervalMs, bulkJob.intervalMs);
      const timeoutMs = positiveMs(options.timeoutMs, bulkJob.timeoutMs);
      const deadline = clock.now() + timeoutMs;
      for (;;) {
        const result = await get(id);
        if (result.error || isFinished(result.data)) return result;
        if (clock.now() + intervalMs > deadline) {
          const error = new ContyError({
            status: null,
            code: bulkJob.timeoutCode,
            message: `Bulk job ${id} did not finish within ${timeoutMs} ms.`,
            details: { job_id: id, status: result.data.status },
          });
          onError?.(error);
          return { data: null, error };
        }
        await sleep(intervalMs);
      }
    },
  };
}
