import { withDeps } from "@conty/core";
import type { ContyOptions, WebPorts, WebStorage } from "../client/types";

const browserStorage: WebStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

const browserLocation = {
  get search() {
    return location.search;
  },
};

export function browserPorts(options: ContyOptions = {}): WebPorts {
  return Object.assign(withDeps(options), {
    storage: options.storage || browserStorage,
    location: options.location || browserLocation,
    warn: options.warn || ((message: string) => console.warn(message)),
  });
}
