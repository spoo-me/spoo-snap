import { useQuery } from "@tanstack/react-query";
import { getAccountStats, getUrlStats, StatsUnavailableError } from "@/api/stats";
import type { StatsQuery } from "@/api/types";

export function useAccountStats(query: StatsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["stats", "account", query],
    queryFn: () => getAccountStats(query),
    enabled,
  });
}

export function useUrlStats(shortCode: string, query: StatsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["stats", "url", shortCode, query],
    queryFn: () => getUrlStats(shortCode, query),
    enabled,
    // "Stats unavailable" is a settled answer (private/password/missing) —
    // retrying can't change it. Everything else keeps the default policy.
    retry: (failureCount, error) =>
      error instanceof StatsUnavailableError ? false : failureCount < 2,
  });
}
