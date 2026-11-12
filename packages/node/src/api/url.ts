function queryValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.length > 0 ? value.join(",") : null;
  return String(value);
}

export function segment(value: string): string {
  return encodeURIComponent(value);
}

export function buildUrl(baseUrl: string, path: string, query: object = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const text = queryValue(value);
    if (text !== null) search.set(key, text);
  }
  const suffix = search.toString();
  return `${baseUrl.replace(/\/+$/, "")}${path}${suffix ? `?${suffix}` : ""}`;
}
