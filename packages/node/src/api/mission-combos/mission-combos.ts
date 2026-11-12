import type { Transport } from "../types";
import { segment } from "../url";
import type { MissionCombosResource } from "./types";

export function createMissionCombos(transport: Transport): MissionCombosResource {
  return {
    setStatus: (id, body, options) =>
      transport.request({
        method: "POST",
        path: `/mission-combos/${segment(id)}/status`,
        body,
        idempotencyKey: options?.idempotencyKey,
      }),
  };
}
