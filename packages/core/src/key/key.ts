import { API, KEY } from "../config/constants";
import type { KeyKind } from "./types";

export function isKeyOfKind(key: unknown, kind: KeyKind): key is string {
  return typeof key === "string" && key.startsWith(KEY.prefix[kind]);
}

export function isSecretKey(key: unknown): key is string {
  return isKeyOfKind(key, "secret");
}

export function isPublishableKey(key: unknown): key is string {
  return isKeyOfKind(key, "publishable");
}

export function eventsUrl(host: string): string {
  return `${host.replace(/\/+$/, "")}${API.eventsPath}`;
}
