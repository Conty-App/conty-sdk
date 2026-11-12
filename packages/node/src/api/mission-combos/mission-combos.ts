import type { RandomId } from "@conty/core";
import { createWriter } from "../request";
import type { Transport } from "../types";
import { segment } from "../url";
import type { MissionCombosResource } from "./types";

export function createMissionCombos(
  transport: Transport,
  randomId: RandomId,
): MissionCombosResource {
  const { optional } = createWriter(transport, randomId);
  return {
    setStatus: (id, body, options) =>
      optional("POST", `/mission-combos/${segment(id)}/status`, body, options),
  };
}
