import type { Utm } from "@conty/core";

export interface AttributionStore {
  capture(): void;
  read(): Utm;
}
