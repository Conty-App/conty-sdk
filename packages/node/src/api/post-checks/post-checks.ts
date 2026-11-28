import type { RandomId } from "@conty/core";
import { createWriter } from "../request";
import type { Transport } from "../types";
import type { PostChecksResource } from "./types";

export function createPostChecks(transport: Transport, randomId: RandomId): PostChecksResource {
  const { optional } = createWriter(transport, randomId);
  return { accept: (body, options) => optional("POST", "/post-checks/accept", body, options) };
}
