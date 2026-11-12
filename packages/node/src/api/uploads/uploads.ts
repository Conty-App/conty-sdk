import type { RandomId } from "@conty/core";
import type { Transport } from "../types";
import type { UploadsResource } from "./types";

export function createUploads(transport: Transport, randomId: RandomId): UploadsResource {
  return {
    create: (body) => transport.request({ method: "POST", path: "/uploads", body }),
    import: (body, options) =>
      transport.request({
        method: "POST",
        path: "/uploads/import",
        body,
        idempotencyKey: options?.idempotencyKey ?? randomId(),
      }),
  };
}
