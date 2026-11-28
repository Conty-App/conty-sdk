import type { RandomId } from "@conty/core";
import { createWriter } from "../request";
import type { Transport } from "../types";
import type { ConversionEventsResource } from "./types";

export function createConversionEvents(
  transport: Transport,
  randomId: RandomId,
): ConversionEventsResource {
  const { optional } = createWriter(transport, randomId);
  return { set: (body, options) => optional("PUT", "/conversion-events", body, options) };
}
