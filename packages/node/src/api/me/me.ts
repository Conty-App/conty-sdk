import type { Transport } from "../types";
import type { MeResource } from "./types";

export function createMe(transport: Transport): MeResource {
  return { get: () => transport.request({ method: "GET", path: "/me" }) };
}
