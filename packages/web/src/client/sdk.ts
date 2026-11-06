import {
  API,
  buildEvent,
  eventsRequest,
  eventsUrl,
  isPublishableKey,
  isSecretKey,
  KEY,
  timestamp,
} from "@conty/core";
import { attributionStore } from "../attribution/store";
import { CONTEXT } from "../config/constants";
import type { Sdk, WebPorts } from "./types";

export function createSdk(ports: WebPorts, origin: string = API.host): Sdk {
  const attribution = attributionStore(ports);
  let key: string | null = null;
  let endpoint = eventsUrl(origin);
  let warned = false;

  function warnSecretKey() {
    if (warned) return;
    warned = true;
    ports.warn(KEY.browserWarning);
  }

  return {
    capture: attribution.capture,
    init(nextKey, options = {}) {
      if (isSecretKey(nextKey)) return warnSecretKey();
      if (!isPublishableKey(nextKey)) return;
      key = nextKey;
      if (typeof options.apiHost === "string") endpoint = eventsUrl(options.apiHost);
    },
    track(name, props = {}) {
      if (!key || typeof name !== "string" || !name) return;
      try {
        const event = buildEvent({
          name,
          props,
          utm: attribution.read(),
          context: CONTEXT,
          occurredAt: timestamp(ports.clock),
          randomId: ports.randomId,
        });
        return ports.fetch(endpoint, eventsRequest(key, [event], true)).catch(() => undefined);
      } catch {}
    },
  };
}
