import { useQuery } from "@tanstack/react-query";
import { getStats } from "@/api/stats";
import type { StatsQuery } from "@/api/types";

export function useStats(query: StatsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ["stats", query],
    queryFn: () => getStats(query),
    enabled,
  });
}

export function useUrlStats(shortCode: string, enabled = true) {
  return useStats({ short_code: shortCode }, enabled);
}
