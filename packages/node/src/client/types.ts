import type { Deps } from "@conty/core";
import type { ContyError } from "../errors/errors";
import type { TrackEvent } from "../event/types";
import type { Sleep } from "../transport/types";

export interface ContyOptions extends Partial<Deps> {
  key: string;
  apiHost?: string;
  maxRetries?: number;
  timeoutMs?: number;
  sleep?: Sleep;
  onError?: (error: ContyError) => void;
}

export interface TrackResult {
  accepted: number;
}

export type ContyResult<T> = { data: T; error: null } | { data: null; error: ContyError };

export interface Conty {
  track(event: TrackEvent): Promise<ContyResult<TrackResult>>;
  trackBatch(events: TrackEvent[]): Promise<ContyResult<TrackResult>>;
}
