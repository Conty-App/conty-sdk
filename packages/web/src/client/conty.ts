import { browserPorts } from "../ports/browser";
import { createSdk } from "./sdk";
import type { Conty, ContyOptions } from "./types";

export function createConty(options: ContyOptions = {}): Conty {
  const sdk = createSdk(browserPorts(options));
  return {
    init(key, initOptions) {
      if (typeof window === "undefined") return;
      sdk.capture();
      sdk.init(key, initOptions);
    },
    track: sdk.track,
  };
}
