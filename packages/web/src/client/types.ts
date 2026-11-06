import type { Deps, TrackProperties } from "@conty/core";

export type WebStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type Warn = (message: string) => void;

export interface WebPorts extends Deps {
  storage: WebStorage;
  location: Pick<Location, "search">;
  warn: Warn;
}

export type ContyOptions = Partial<WebPorts>;

export interface InitOptions {
  apiHost?: string;
}

export interface Conty {
  init(key: string, options?: InitOptions): void;
  track(name: string, props?: TrackProperties): Promise<Response | undefined> | undefined;
}

export interface Sdk extends Conty {
  capture(): void;
}
