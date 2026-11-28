import type { ContyResult } from "../../client/types";
import type { components } from "../generated/openapi";
import type { RequestOptions } from "../types";

type Schemas = components["schemas"];

export type Upload = Schemas["Upload"];
export type UploadPurpose = Schemas["UploadPurpose"];
export type CreateUploadBody = Schemas["CreateUploadBody"];
export type ImportUploadBody = Schemas["ImportUploadBody"];
export type ImportedUpload = Schemas["ImportedUpload"];

export interface UploadsResource {
  create(body: CreateUploadBody): Promise<ContyResult<Upload>>;
  import(body: ImportUploadBody, options?: RequestOptions): Promise<ContyResult<ImportedUpload>>;
}
