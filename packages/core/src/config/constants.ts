export const API = {
  host: "https://conty.link",
  eventsPath: "/v1/events",
  scriptPath: "/sdk.js",
} as const;

export const KEY = {
  prefix: { secret: "cev_", publishable: "cpk_" },
  browserWarning: "Conty: use a publishable key (cpk_) in the browser",
} as const;

export const EVENT = {
  name: { max: 64, pattern: /^[a-z0-9_:.$-]+$/ },
  externalId: { max: 128 },
  linkCode: { max: 32 },
  valueCents: { max: 2_147_483_647 },
  properties: { maxBytes: 2048 },
  batch: { max: 100 },
  message: { maxBytes: 122_880, envelopeReserveBytes: 1024 },
} as const;

export const BATCH = {
  byteBudget: EVENT.message.maxBytes - EVENT.message.envelopeReserveBytes,
} as const;

export const UTM = {
  keys: ["utm_source", "utm_medium", "utm_campaign", "utm_content"],
  maxLength: 200,
  creatorCode: [
    /^cr_[0-9a-f]{8}$/i,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  ],
} as const;

export const ATTRIBUTION = {
  storageKey: "conty_attribution",
  ttlMs: 2_592_000_000,
} as const;

export const RETRY = {
  maxRetries: 2,
  maxRetriesLimit: 10,
  baseDelayMs: 500,
  maxDelayMs: 30_000,
  maxRetryAfterMs: 120_000,
  timeoutMs: 10_000,
} as const;

export const QUEUE = { maxWaitMs: 10_000 } as const;
