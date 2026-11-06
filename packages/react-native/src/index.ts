import { createConty } from "./client/conty";

export type { Clock, ContyEvent, Fetch, RandomId, TrackProperties } from "@conty/core";
export { createConty } from "./client/conty";
export type {
  Conty,
  ContyOptions,
  ContyStorage,
  InitOptions,
  LinkingSource,
  PlatformInfo,
} from "./client/types";

export const conty = createConty();
