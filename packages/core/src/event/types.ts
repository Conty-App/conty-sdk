import type { Utm } from "../attribution/types";
import type { RandomId } from "../ports/types";

export type EventProperties = Record<string, unknown>;

export interface ContyEvent {
  event: string;
  occurred_at: string;
  external_id: string;
  value_cents?: number;
  link_code?: string;
  utm_campaign?: string;
  utm_content?: string;
  properties?: EventProperties;
}

export interface TrackProperties {
  value_cents?: number;
  external_id?: string | number;
  link_code?: string;
  [property: string]: unknown;
}

export interface EventInput {
  name: string;
  props: TrackProperties;
  utm: Utm;
  context: EventProperties;
  occurredAt: string;
  randomId: RandomId;
}

export type Compact<T> = { [K in keyof T]?: NonNullable<T[K]> };
