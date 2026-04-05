import { request } from "@/api/client";
import type { StatsQuery, StatsResponse } from "@/api/types";
import { API_BASE_URL, API_V1 } from "@/lib/constants";
import { ApiError } from "@/lib/errors";
import { statsResponseSchema } from "@/schemas/api";

/**
 * Get stats via v1 API (works for v2/new URLs only).
 */
export function getStatsV1(query: StatsQuery = {}): Promise<StatsResponse> {
  return request(
    `${API_V1}/stats`,
    { params: query as Record<string, string | number | boolean | undefined> },
    statsResponseSchema,
  );
}

/**
 * V0 stats response shape (legacy embedded analytics).
 */
export interface V0StatsResponse {
  _id: string;
  short_code: string;
  url: string;
  "total-clicks": number;
  total_unique_clicks: number;
  "creation-date": string;
  "last-click": string | null;
  "last-click-browser": string | null;
  "last-click-os": string | null;
  average_daily_clicks: number;
  average_weekly_clicks: number;
  average_monthly_clicks: number;
  average_redirection_time: number;
  counter: Record<string, number>;
  unique_counter: Record<string, number>;
  browser: Record<string, number>;
  unique_browser: Record<string, number>;
  os_name: Record<string, number>;
  unique_os_name: Record<string, number>;
  country: Record<string, number>;
  unique_country: Record<string, number>;
  referrer: Record<string, number>;
  unique_referrer: Record<string, number>;
}

/**
 * Get stats via v0 API (works for legacy/v0 URLs).
 * POST /stats/{shortCode} with optional password.
 */
export async function getStatsV0(shortCode: string, password?: string): Promise<V0StatsResponse> {
  const url = `${API_BASE_URL}/stats/${shortCode}`;
  const headers: Record<string, string> = {};

  const body = password ? new URLSearchParams({ password }) : undefined;
  if (body) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: body?.toString(),
  });

  if (!res.ok) {
    throw new Error(`Stats request failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Convert v0 stats to the same shape the UI expects.
 */
function v0ToStatsResponse(v0: V0StatsResponse): StatsResponse {
  // Convert Record<string, number> breakdowns to array format
  const toArray = (obj: Record<string, number>, nameKey: string) =>
    Object.entries(obj)
      .sort(([, a], [, b]) => b - a)
      .map(([name, clicks]) => ({ [nameKey]: name, clicks }));

  return {
    scope: "anon",
    filters: {},
    group_by: [],
    timezone: "UTC",
    time_range: { start_date: v0["creation-date"], end_date: null },
    summary: {
      total_clicks: v0["total-clicks"],
      unique_clicks: v0.total_unique_clicks,
      first_click: v0["creation-date"],
      last_click: v0["last-click"],
      avg_redirection_time: v0.average_redirection_time,
    },
    metrics: {
      browser: toArray(v0.browser, "browser"),
      os: toArray(v0.os_name, "os"),
      country: toArray(v0.country, "country"),
      referrer: toArray(v0.referrer, "referrer"),
      clicks_over_time: Object.entries(v0.counter)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, clicks]) => ({ date, clicks })),
    },
    computed_metrics: {
      // Match v1 format: rates are already percentages (e.g. 6.25 = 6.25%)
      unique_click_rate:
        v0["total-clicks"] > 0
          ? Math.round((v0.total_unique_clicks / v0["total-clicks"]) * 10000) / 100
          : 0,
      repeat_click_rate:
        v0["total-clicks"] > 0
          ? Math.round(
              ((v0["total-clicks"] - v0.total_unique_clicks) / v0["total-clicks"]) * 10000,
            ) / 100
          : 0,
      average_clicks_per_visitor:
        v0.total_unique_clicks > 0
          ? Math.round((v0["total-clicks"] / v0.total_unique_clicks) * 100) / 100
          : 0,
    },
  };
}

/**
 * Get stats with automatic v1 -> v0 fallback.
 * Tries v1 API first (for v2 URLs), falls back to v0 (for legacy URLs).
 */
export async function getStats(query: StatsQuery = {}): Promise<StatsResponse> {
  // If querying a specific short code, use scope=anon, try v1 first, fall back to v0
  if (query.short_code) {
    try {
      return await getStatsV1({ ...query, scope: query.scope ?? "anon" });
    } catch (e) {
      // v1 404 means it's a legacy URL — fall back to v0 endpoint
      if (e instanceof ApiError && e.isNotFound) {
        const v0 = await getStatsV0(query.short_code);
        return v0ToStatsResponse(v0);
      }
      throw e;
    }
  }

  // No specific short code — use v1 API only
  return getStatsV1(query);
}
