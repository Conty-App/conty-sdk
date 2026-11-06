import { ATTRIBUTION, createAttribution, isActive, parseAttribution, pickUtm } from "@conty/core";
import type { WebPorts } from "../client/types";
import type { AttributionStore } from "./types";

export function attributionStore(ports: WebPorts): AttributionStore {
  const { storage, clock } = ports;
  const { storageKey } = ATTRIBUTION;
  return {
    capture() {
      try {
        const params = new URLSearchParams(ports.location.search);
        const utm = pickUtm((name) => params.get(name));
        if (utm) storage.setItem(storageKey, JSON.stringify(createAttribution(utm, clock)));
      } catch {}
    },
    read() {
      try {
        const saved = parseAttribution(storage.getItem(storageKey));
        if (isActive(saved, clock)) return saved.utm;
        storage.removeItem(storageKey);
      } catch {}
      return {};
    },
  };
}
