import { useQuery } from "@tanstack/react-query";
import type { AggregateStatsParams, StatsParams } from "spoo.me";
import { getAccountStats, getUrlStats, StatsUnavailableError } from "@/api/stats";

export function useAccountStats(params: AggregateStatsParams = {}, enabled = true) {
  return useQuery({
    queryKey: ["stats", "account", params],
    queryFn: () => getAccountStats(params),
    enabled,
  });
}

export function useUrlStats(shortCode: string, params: StatsParams = {}, enabled = true) {
  return useQuery({
    queryKey: ["stats", "url", shortCode, params],
    queryFn: () => getUrlStats(shortCode, params),
    enabled,
    // "Stats unavailable" is a settled answer (private/password/missing) —
    // retrying can't change it. Everything else keeps the default policy.
    retry: (failureCount, error) =>
      error instanceof StatsUnavailableError ? false : failureCount < 2,
  });
}
