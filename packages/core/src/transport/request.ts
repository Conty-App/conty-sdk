import type { ContyEvent } from "../event/types";

export function eventsRequest(key: string, events: ContyEvent[], keepalive?: boolean): RequestInit {
  return {
    method: "POST",
    keepalive,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  };
}
