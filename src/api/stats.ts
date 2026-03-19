import { request } from "@/api/client";
import type { StatsQuery, StatsResponse } from "@/api/types";
import { API_V1 } from "@/lib/constants";
import { statsResponseSchema } from "@/schemas/api";

export function getStats(query: StatsQuery = {}): Promise<StatsResponse> {
  return request(
    `${API_V1}/stats`,
    { params: query as Record<string, string | number | boolean | undefined> },
    statsResponseSchema,
  );
}
