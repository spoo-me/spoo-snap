import {
  APIConnectionError,
  APIError,
  AuthenticationError,
  ForbiddenError,
  RateLimitError,
  SessionExpiredError,
} from "spoo.me";

/** Thrown by the offline gate before a request is even attempted. */
export class NetworkError extends Error {
  constructor(message = "Network error. Check your connection.") {
    super(message);
    this.name = "NetworkError";
  }
}

export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Human-readable message for surfacing an error in the UI. SDK errors carry
 * wire-shaped messages ("404 not_found: ..."), which are not user copy.
 */
export function userMessage(err: unknown): string {
  if (err instanceof RateLimitError) {
    return "Too many requests. Please try again later.";
  }
  if (err instanceof AuthenticationError) {
    return "Please sign in to continue.";
  }
  if (err instanceof ForbiddenError) {
    return "You don't have permission to do that.";
  }
  if (err instanceof APIError) {
    // http_<status> codes mean the body wasn't the API's JSON error shape
    // (proxy or edge-composed responses) — nothing in it is user copy.
    if (/^http_\d+$/.test(err.code)) {
      return "Something went wrong on the server. Please try again.";
    }
    return err.body.error;
  }
  if (err instanceof SessionExpiredError) {
    return "Your session has expired. Please sign in again.";
  }
  if (err instanceof APIConnectionError) {
    return "Network error. Check your connection.";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong.";
}
