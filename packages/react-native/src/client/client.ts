import {
  API,
  ATTRIBUTION,
  type Attribution,
  buildEvent,
  type ContyEvent,
  chunkEvents,
  createAttribution,
  EVENT,
  eventsRequest,
  eventsUrl,
  isActive,
  isPublishableKey,
  parseAttribution,
  QUEUE,
  timestamp,
} from "@conty/core";
import { utmFromUrl } from "../linking/deep-link";
import type { Conty, NativePorts, Pending } from "./types";

export function createClient(ports: NativePorts, maxWaitMs: number = QUEUE.maxWaitMs): Conty {
  const { storage, linking, platform, clock } = ports;
  const context = { $os: platform.OS, $os_version: String(platform.Version) };
  const { storageKey } = ATTRIBUTION;
  const queue: Pending[] = [];
  let key: string | null = null;
  let endpoint = eventsUrl(API.host);
  let attribution: Attribution | null = null;
  let started = false;
  let ready = false;

  async function captureUrl(url: string) {
    const utm = typeof url === "string" ? utmFromUrl(url) : null;
    if (!utm) return;
    attribution = createAttribution(utm, clock);
    try {
      await storage.setItem(storageKey, JSON.stringify(attribution));
    } catch {}
  }

  async function post(apiKey: string, events: ContyEvent[]) {
    try {
      return await ports.fetch(endpoint, eventsRequest(apiKey, events));
    } catch {
      return undefined;
    }
  }

  async function send(apiKey: string, items: Pending[]) {
    let offset = 0;
    try {
      const utm = isActive(attribution, clock) ? attribution.utm : {};
      const events = items.map(({ name, props, occurredAt }) =>
        buildEvent({ name, props, utm, context, occurredAt, randomId: ports.randomId }),
      );
      for (const chunk of chunkEvents(events)) {
        const response = await post(apiKey, chunk);
        for (const item of items.slice(offset, offset + chunk.length)) item.resolve(response);
        offset += chunk.length;
      }
    } catch {
      for (const item of items.slice(offset)) item.resolve(undefined);
    }
  }

  function flush() {
    if (ready && key && queue.length) send(key, queue.splice(0));
  }

  function expire(item: Pending) {
    const index = queue.indexOf(item);
    if (index < 0) return;
    queue.splice(index, 1);
    item.resolve(undefined);
  }

  function enqueue(item: Pending) {
    if (queue.length >= EVENT.batch.max) return item.resolve(undefined);
    const queued: Pending = {
      ...item,
      resolve(response) {
        clearTimeout(timer);
        item.resolve(response);
      },
    };
    const timer = setTimeout(() => expire(queued), maxWaitMs);
    queue.push(queued);
  }

  async function prepare() {
    try {
      const stored = parseAttribution(await storage.getItem(storageKey));
      attribution ??= stored;
    } catch {}
    try {
      linking.addEventListener("url", (event) => {
        if (event) captureUrl(event.url);
      });
      const before = attribution;
      const initial = await linking.getInitialURL();
      if (initial && attribution === before) await captureUrl(initial);
    } catch {}
    ready = true;
    flush();
  }

  return {
    captureUrl,
    init(nextKey, options = {}) {
      if (!isPublishableKey(nextKey)) return;
      key = nextKey;
      if (typeof options.apiHost === "string") endpoint = eventsUrl(options.apiHost);
      if (started) return flush();
      started = true;
      prepare();
    },
    track(name, props = {}) {
      if (typeof name !== "string" || !name) return;
      return new Promise((resolve) => {
        const item = { name, props, occurredAt: timestamp(clock), resolve };
        if (ready && key) return send(key, [item]);
        enqueue(item);
      });
    },
  };
}
