import { UTM } from "../config/constants";
import type { Utm, UtmKey } from "./types";

export function cleanText(value: unknown): string | undefined {
  const text = typeof value === "string" ? value.trim().slice(0, UTM.maxLength) : "";
  return text || undefined;
}

export function isCreatorCode(value: string | undefined): boolean {
  return value !== undefined && UTM.creatorCode.some((pattern) => pattern.test(value));
}

export function pickUtm(read: (key: UtmKey) => unknown): Utm | null {
  const utm: Utm = {};
  for (const key of UTM.keys) {
    const value = cleanText(read(key));
    if (value) utm[key] = value;
  }
  return utm.utm_campaign && isCreatorCode(utm.utm_content) ? utm : null;
}
