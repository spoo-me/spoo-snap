import { QueryClient } from "@tanstack/react-query";
import {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "spoo.me";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
          // Settled answers: retrying can't change a 401/403/404, a
          // validation failure or a rate limit. The SDK is built with
          // maxRetries: 0, so TanStack Query is the only retry layer.
          if (
            error instanceof AuthenticationError ||
            error instanceof ForbiddenError ||
            error instanceof NotFoundError ||
            error instanceof ValidationError ||
            error instanceof RateLimitError
          ) {
            return false;
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
      mutations: {
        retry: false,
      },
    },
  });
}
