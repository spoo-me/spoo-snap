import type { ApiErrorResponse } from "@/api/types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly field?: string;
  readonly details?: unknown;
  readonly retryAfter?: number;

  constructor(status: number, response: ApiErrorResponse, retryAfter?: number) {
    super(response.error);
    this.name = "ApiError";
    this.status = status;
    this.code = response.code;
    this.field = response.field;
    this.details = response.details;
    this.retryAfter = retryAfter;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isValidationError(): boolean {
    return this.status === 400;
  }

  get userMessage(): string {
    if (this.isRateLimited) {
      return "Too many requests. Please try again later.";
    }
    if (this.isUnauthorized) {
      return "Please sign in to continue.";
    }
    if (this.isForbidden) {
      return "You don't have permission to do that.";
    }
    return this.message;
  }
}

export class NetworkError extends Error {
  constructor(message = "Network error. Check your connection.") {
    super(message);
    this.name = "NetworkError";
  }
}

export function isOffline(): boolean {
  return !navigator.onLine;
}
