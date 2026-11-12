import type { RandomId } from "@conty/core";
import type { ContyResult } from "../client/types";
import type { HttpMethod, RequestOptions, Transport } from "./types";

export interface Writer {
  optional<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ContyResult<T>>;
  required<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ContyResult<T>>;
}

export function createWriter(transport: Transport, randomId: RandomId): Writer {
  return {
    optional: (method, path, body, options) =>
      transport.request({ method, path, body, idempotencyKey: options?.idempotencyKey }),
    required: (method, path, body, options) =>
      transport.request({
        method,
        path,
        body,
        idempotencyKey: options?.idempotencyKey ?? randomId(),
      }),
  };
}
