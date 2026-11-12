import type { RandomId } from "@conty/core";
import { createWriter } from "../request";
import type { Transport } from "../types";
import type { UploadsResource } from "./types";

export function createUploads(transport: Transport, randomId: RandomId): UploadsResource {
  const { required } = createWriter(transport, randomId);
  return {
    create: (body) => transport.request({ method: "POST", path: "/uploads", body }),
    import: (body, options) => required("POST", "/uploads/import", body, options),
  };
}
