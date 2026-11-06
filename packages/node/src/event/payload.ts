import { type ContyEvent, compact, type Deps, timestamp } from "@conty/core";
import type { TrackEvent } from "./types";

export function toPayload(
  { event, occurred_at, external_id, ...rest }: TrackEvent,
  { clock, randomId }: Deps,
): ContyEvent {
  return {
    ...compact(rest),
    event,
    occurred_at:
      occurred_at instanceof Date ? occurred_at.toISOString() : (occurred_at ?? timestamp(clock)),
    external_id: external_id || randomId(),
  };
}
