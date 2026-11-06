import type { ContyEvent, EventProperties } from "@conty/core";

type Nullable<T> = { [K in keyof T]?: T[K] | null };

type OptionalFields = "external_id" | "value_cents" | "link_code" | "utm_campaign" | "utm_content";

export interface TrackEvent extends Nullable<Pick<ContyEvent, OptionalFields>> {
  event: string;
  occurred_at?: string | Date;
  properties?: EventProperties;
}
