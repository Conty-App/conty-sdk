import type { Deps, TrackProperties } from "@conty/core";

export interface ContyStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface LinkingSource {
  getInitialURL(): Promise<string | null | undefined>;
  addEventListener(type: "url", handler: (event: { url: string }) => void): unknown;
}

export interface PlatformInfo {
  OS: string;
  Version: string | number;
}

export interface NativePorts extends Deps {
  storage: ContyStorage;
  linking: LinkingSource;
  platform: PlatformInfo;
}

export type ContyOptions = Partial<NativePorts>;

export interface InitOptions {
  apiHost?: string;
}

export interface Conty {
  init(key: string, options?: InitOptions): void;
  track(name: string, props?: TrackProperties): Promise<Response | undefined> | undefined;
  captureUrl(url: string): Promise<void>;
}

export interface Pending {
  name: string;
  props: TrackProperties;
  occurredAt: string;
  resolve(response: Response | undefined): void;
}
