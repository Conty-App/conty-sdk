import { createConty } from "./client/conty";

export type { Clock, ContyEvent, Fetch, RandomId, TrackProperties } from "@conty/core";
export { createConty } from "./client/conty";
export type { Conty, ContyOptions, InitOptions, Warn, WebStorage } from "./client/types";

export const conty = createConty();
