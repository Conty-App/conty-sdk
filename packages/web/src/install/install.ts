import { API, prop } from "@conty/core";
import { createSdk } from "../client/sdk";
import type { Conty, WebPorts } from "../client/types";
import type { ContyTarget, ScriptTag } from "./types";

export function scriptOrigin(src: string): string {
  try {
    const { origin, pathname } = new URL(src);
    return pathname === API.scriptPath ? origin : API.host;
  } catch {
    return API.host;
  }
}

function argumentLists(value: unknown): unknown[][] {
  const items: unknown[] = Array.isArray(value) ? value : [];
  const lists: unknown[][] = [];
  for (const item of items) {
    if (Array.isArray(item)) lists.push(item);
  }
  return lists;
}

export function install(
  target: ContyTarget,
  script: ScriptTag | null,
  ports: WebPorts,
): Conty | undefined {
  const pending = target.conty;
  if (prop(pending, "__loaded")) return;
  const { src, dataset } = script || { src: "", dataset: {} };
  const sdk = createSdk(ports, src ? scriptOrigin(src) : API.host);
  sdk.capture();
  const conty = { __loaded: true, init: sdk.init, track: sdk.track };
  target.conty = conty;
  if (dataset.key) sdk.init(dataset.key);
  for (const args of argumentLists(prop(pending, "q"))) Reflect.apply(sdk.track, conty, args);
  for (const [name, ...args] of argumentLists(pending)) {
    if (name === "init" || name === "track") Reflect.apply(sdk[name], conty, args);
  }
  return conty;
}
