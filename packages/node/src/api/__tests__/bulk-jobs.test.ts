import { describe, expect, it, vi } from "vitest";
import { apiError, BASE, call, json, setup } from "./setup";

const JOB_ID = "7c2d4e6f-8a0b-4c1d-9e3f-5a7b9c1d3e5f";

function job(status: string, extra: Record<string, unknown> = {}) {
  return {
    id: JOB_ID,
    action: "send",
    status,
    total: 2,
    succeeded: status === "done" ? 2 : 0,
    failed: 0,
    message: null,
    awaiting_briefing: null,
    failures: [],
    next_cursor: null,
    ...extra,
  };
}

function movingClock() {
  let now = 0;
  return {
    clock: { now: () => now },
    sleep: async (ms: number) => {
      now += ms;
    },
  };
}

describe("bulkJobs.get", () => {
  it("gets the job with the failures cursor on the query", async () => {
    const { conty, fetch } = setup([json(job("running"))]);

    const { data } = await conty.bulkJobs.get(JOB_ID, { cursor: "f1", limit: 50 });

    expect(data?.status).toBe("running");
    expect(call(fetch).init?.method).toBe("GET");
    expect(call(fetch).url).toBe(`${BASE}/bulk-jobs/${JOB_ID}?cursor=f1&limit=50`);
  });
});

describe("bulkJobs.wait", () => {
  it("polls until the job is done waiting the interval between reads", async () => {
    const { clock, sleep } = movingClock();
    const sleepSpy = vi.fn(sleep);
    const { conty, fetch } = setup([json(job("queued")), json(job("running")), json(job("done"))], {
      clock,
      sleep: sleepSpy,
    });

    const { data, error } = await conty.bulkJobs.wait(JOB_ID, { intervalMs: 500 });

    expect(error).toBeNull();
    expect(data?.status).toBe("done");
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(sleepSpy.mock.calls).toEqual([[500], [500]]);
  });

  it("returns a failed job as data", async () => {
    const { clock, sleep } = movingClock();
    const failures = [{ id: "m1", code: "invalid_transition", message: null }];
    const { conty } = setup([json(job("failed", { failures }))], { clock, sleep });

    const { data, error } = await conty.bulkJobs.wait(JOB_ID);

    expect(error).toBeNull();
    expect(data?.failures).toEqual(failures);
  });

  it("returns bulk_job_timeout when the job does not finish in time", async () => {
    const { clock, sleep } = movingClock();
    const onError = vi.fn();
    const { conty, fetch } = setup(
      [json(job("running")), json(job("running")), json(job("running"))],
      { clock, sleep, onError },
    );

    const { data, error } = await conty.bulkJobs.wait(JOB_ID, {
      intervalMs: 1_000,
      timeoutMs: 2_000,
    });

    expect(data).toBeNull();
    expect(error).toMatchObject({
      status: null,
      code: "bulk_job_timeout",
      details: { job_id: JOB_ID, status: "running" },
    });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("returns the API error of a read without polling again", async () => {
    const { clock, sleep } = movingClock();
    const { conty, fetch } = setup([apiError(404, "not_found")], { clock, sleep });

    const { error } = await conty.bulkJobs.wait(JOB_ID);

    expect(error).toMatchObject({ status: 404, code: "not_found" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
