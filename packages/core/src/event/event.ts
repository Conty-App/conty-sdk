import { cleanText } from "../attribution/utm";
import type { Clock } from "../ports/types";
import { compact } from "./compact";
import type { ContyEvent, EventInput } from "./types";

export function timestamp(clock: Clock): string {
  return new Date(clock.now()).toISOString();
}

export function buildEvent({
  name,
  props,
  utm,
  context,
  occurredAt,
  randomId,
}: EventInput): ContyEvent {
  const { value_cents, external_id, link_code, ...rest } = props;
  const { utm_source, utm_medium, utm_campaign, utm_content } = utm;
  const properties = { ...context, ...rest, ...compact({ utm_source, utm_medium }) };
  return {
    ...compact({
      value_cents: typeof value_cents === "number" ? Math.round(value_cents) : null,
      link_code: cleanText(link_code),
      utm_campaign,
      utm_content,
      properties: Object.keys(properties).length ? properties : null,
    }),
    event: name,
    occurred_at: occurredAt,
    external_id: external_id != null && external_id !== "" ? String(external_id) : randomId(),
  };
}
