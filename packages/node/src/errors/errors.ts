import { isPublishableKey, KEY, parseJson, prop } from "@conty/core";
import type { ContyErrorInit } from "./types";

export class ContyError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly details: unknown;
  readonly accepted: number;

  constructor({ status, code, message, details, accepted = 0 }: ContyErrorInit) {
    super(message);
    this.name = "ContyError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.accepted = accepted;
  }
}

function isTimeout(cause: unknown): boolean {
  return cause instanceof Error && cause.name === "TimeoutError";
}

export function toContyError(cause: unknown, code: string): ContyError {
  if (cause instanceof ContyError) return cause;
  const message = cause instanceof Error ? cause.message : "Unexpected failure.";
  return new ContyError({
    status: null,
    code: isTimeout(cause) ? "timeout" : code,
    message,
    details: cause,
  });
}

export function withAccepted(error: ContyError, accepted: number): ContyError {
  if (accepted === error.accepted) return error;
  const { status, code, message, details } = error;
  return new ContyError({ status, code, message, details, accepted });
}

export async function errorFromResponse(response: Response): Promise<ContyError> {
  const { status } = response;
  const text = await response.text().catch(() => "");
  const error = prop(parseJson(text), "error");
  const code = prop(error, "code");
  const message = prop(error, "message");
  return new ContyError({
    status,
    code: typeof code === "string" ? code : `http_${status}`,
    message:
      typeof message === "string" ? message : text.trim() || `Conty API responded with ${status}.`,
    details: prop(error, "details"),
  });
}

export function keyError(key: unknown): ContyError {
  const message = isPublishableKey(key)
    ? `Publishable keys (${KEY.prefix.publishable}) are for the browser and the app. Use a secret key (${KEY.prefix.secret}) on the server.`
    : `Event key must start with ${KEY.prefix.secret}.`;
  return new ContyError({ status: null, code: "invalid_event_key", message });
}
