import { QueryClient } from "@tanstack/react-query";
import { AuthenticationError, ForbiddenError, RateLimitError, ValidationError } from "spoo.me";
import { NetworkError } from "@/lib/errors";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry on auth errors or validation errors, and respect
          // rate limits. The SDK is built with maxRetries: 0, so TanStack
          // Query is the only retry layer.
          if (
            error instanceof AuthenticationError ||
            error instanceof ForbiddenError ||
            error instanceof ValidationError ||
            error instanceof RateLimitError
          ) {
            return false;
          }
          // Network errors (offline gate or SDK connection failures) and
          // everything else retry up to 2 times.
          if (error instanceof NetworkError) {
            return failureCount < 2;
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
