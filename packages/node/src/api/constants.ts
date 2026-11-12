export const PUBLIC_API = {
  baseUrl: "https://api.appconty.com/public/v1",
  keyPrefix: "ck_live_",
  header: {
    authorization: "Authorization",
    accept: "Accept",
    contentType: "Content-Type",
    idempotency: "Idempotency-Key",
    requestId: "X-Request-ID",
    retryAfter: "Retry-After",
  },
  jsonContent: "application/json",
  textContent: /^text\/csv\b/i,
  csvAccept: "text/csv, application/json",
  bulkJob: {
    intervalMs: 1_000,
    timeoutMs: 120_000,
    terminal: ["done", "failed"],
    timeoutCode: "bulk_job_timeout",
  },
} as const;
