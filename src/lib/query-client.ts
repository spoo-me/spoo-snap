import { QueryClient } from "@tanstack/react-query";
import { ApiError, NetworkError } from "@/lib/errors";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry on auth errors or validation errors
          if (error instanceof ApiError) {
            if (error.isUnauthorized || error.isForbidden || error.isValidationError) {
              return false;
            }
            // Respect rate limit
            if (error.isRateLimited) return false;
          }
          // Retry network errors up to 2 times
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
