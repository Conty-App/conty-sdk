import {
  API,
  type ContyEvent,
  chunkEvents,
  eventsRequest,
  eventsUrl,
  isSecretKey,
  prop,
  RETRY,
  withDeps,
} from "@conty/core";
import {
  type ContyError,
  errorFromResponse,
  keyError,
  toContyError,
  withAccepted,
} from "../errors/errors";
import { toPayload } from "../event/payload";
import { retryDelayMs, sleep } from "../transport/retry";
import { clampRetries, positiveMs } from "./options";
import type { Conty, ContyOptions, ContyResult, TrackResult } from "./types";

export function createConty(options: ContyOptions): Conty {
  if (!isSecretKey(options?.key)) throw keyError(options?.key);
  const { key, onError, sleep: wait = sleep, apiHost = API.host } = options;
  const endpoint = eventsUrl(apiHost);
  const maxRetries = clampRetries(options.maxRetries);
  const timeoutMs = positiveMs(options.timeoutMs, RETRY.timeoutMs);
  const deps = withDeps(options);

  async function attempt(events: ContyEvent[]): Promise<Response> {
    const signal = AbortSignal.timeout(timeoutMs);
    return deps.fetch(endpoint, { ...eventsRequest(key, events), signal });
  }

  async function send(events: ContyEvent[]): Promise<number> {
    for (let attemptIndex = 0; ; attemptIndex++) {
      const last = attemptIndex >= maxRetries;
      const response = await attempt(events).catch((cause: unknown) => {
        if (last) throw toContyError(cause, "network_error");
        return null;
      });
      if (response?.ok) {
        const accepted = prop(await response.json().catch(() => null), "accepted");
        return typeof accepted === "number" ? accepted : events.length;
      }
      const retryable = response === null || response.status === 429 || response.status >= 500;
      if (response && (last || !retryable)) throw await errorFromResponse(response);
      await response?.body?.cancel().catch(() => undefined);
      const retryAfter = response?.headers.get("Retry-After") ?? null;
      await wait(retryDelayMs(attemptIndex, retryAfter, deps.clock.now()));
    }
  }

  function fail(error: ContyError): ContyResult<TrackResult> {
    onError?.(error);
    return { data: null, error };
  }

  async function deliver(build: () => ContyEvent[]): Promise<ContyResult<TrackResult>> {
    let events: ContyEvent[];
    try {
      events = build();
    } catch (cause) {
      return fail(toContyError(cause, "invalid_event"));
    }
    let accepted = 0;
    try {
      for (const chunk of chunkEvents(events)) accepted += await send(chunk);
      return { data: { accepted }, error: null };
    } catch (cause) {
      return fail(withAccepted(toContyError(cause, "unexpected_error"), accepted));
    }
  }

  return {
    track: (event) => deliver(() => [toPayload(event, deps)]),
    trackBatch: (events) => deliver(() => events.map((event) => toPayload(event, deps))),
  };
}
