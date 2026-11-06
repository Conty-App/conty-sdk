import { pickUtm, type Utm } from "@conty/core";

function decode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

export function queryParams(url: string): Map<string, string> {
  const params = new Map<string, string>();
  const base = url.split("#")[0] ?? "";
  const start = base.indexOf("?");
  const query = start < 0 ? "" : base.slice(start + 1);
  for (const pair of query.split("&")) {
    const separator = pair.indexOf("=");
    const name = decode(pair.slice(0, separator));
    if (separator > 0 && !params.has(name)) params.set(name, decode(pair.slice(separator + 1)));
  }
  return params;
}

export function utmFromUrl(url: string): Utm | null {
  const params = queryParams(url);
  return pickUtm((key) => params.get(key));
}
