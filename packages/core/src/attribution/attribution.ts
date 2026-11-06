import { ATTRIBUTION } from "../config/constants";
import type { Clock } from "../ports/types";
import { parseJson, prop } from "../transport/json";
import type { Attribution, Utm } from "./types";
import { pickUtm } from "./utm";

export function createAttribution(utm: Utm, clock: Clock): Attribution {
  return { utm, expires_at: clock.now() + ATTRIBUTION.ttlMs };
}

export function parseAttribution(raw: string | null | undefined): Attribution | null {
  const saved = parseJson(raw);
  const expiresAt = prop(saved, "expires_at");
  const utm = pickUtm((key) => prop(prop(saved, "utm"), key));
  return typeof expiresAt === "number" && utm ? { utm, expires_at: expiresAt } : null;
}

export function isActive(
  attribution: Attribution | null,
  clock: Clock,
): attribution is Attribution {
  return attribution !== null && attribution.expires_at > clock.now();
}
