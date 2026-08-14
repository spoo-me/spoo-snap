import { request } from "@/api/client";
import type { PublicStatsQuery, StatsQuery, StatsResponse } from "@/api/types";
import { getUrlByAddress } from "@/api/urls";
import { API_BASE_URL, API_V1 } from "@/lib/constants";
import { ApiError } from "@/lib/errors";
import { authModeStorage } from "@/lib/storage";
import { publicStatsResponseSchema, statsResponseSchema } from "@/schemas/api";

/**
 * Thrown when per-link stats exist behind a gate we can't pass:
 * the code is unknown, the owner made stats private (404), or the
 * link is password protected (401 password_required). The UI treats
 * all of these as a single "stats unavailable" state.
 */
export class StatsUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StatsUnavailableError";
  }
}

/**
 * Account-wide analytics. GET /api/v1/stats — auth required.
 */
export function getAccountStats(query: StatsQuery = {}): Promise<StatsResponse> {
  return request(
    `${API_V1}/stats`,
    { params: query as Record<string, string | number | boolean | undefined> },
    statsResponseSchema,
  );
}

/**
 * Stats for one link the signed-in user owns.
 * GET /api/v1/stats/links/{urlId} — auth required, 404 for foreign/unknown ids.
 */
export function getLinkStats(urlId: string, query: StatsQuery = {}): Promise<StatsResponse> {
  return request(
    `${API_V1}/stats/links/${urlId}`,
    { params: query as Record<string, string | number | boolean | undefined> },
    statsResponseSchema,
  );
}

/**
 * Public per-link stats. GET /api/v1/public/stats/{shortCode} — no auth.
 * The envelope is {generation, link, stats}; the inner stats object is the
 * same wire shape as the authed endpoints, so we unwrap it here.
 */
export async function getPublicStats(
  shortCode: string,
  query: PublicStatsQuery = {},
): Promise<StatsResponse> {
  const { stats } = await request(
    `${API_V1}/public/stats/${encodeURIComponent(shortCode)}`,
    {
      params: query as Record<string, string | number | boolean | undefined>,
      noAuth: true,
    },
    publicStatsResponseSchema,
  );
  return stats;
}

/**
 * Get stats for a short code, picking the right surface at runtime:
 *
 * 1. Signed in → resolve the code to an owned url id via
 *    GET /urls/{domain}/{alias} and use the per-link authed endpoint.
 * 2. Resolution 404s (not our link) or we're anonymous → fall back to
 *    the public stats endpoint.
 *
 * Public 404 (unknown code or private stats) and 401 (password
 * protected) both surface as StatsUnavailableError.
 */
export async function getUrlStats(
  shortCode: string,
  query: StatsQuery = {},
): Promise<StatsResponse> {
  const mode = await authModeStorage.getValue();

  if (mode === "jwt" || mode === "apikey") {
    try {
      const url = await getUrlByAddress(new URL(API_BASE_URL).hostname, shortCode);
      return await getLinkStats(url.id, query);
    } catch (e) {
      // 404 means the link isn't in this account (foreign or unknown) —
      // the public surface is the only remaining read path.
      if (!(e instanceof ApiError && e.isNotFound)) throw e;
    }
  }

  try {
    return await getPublicStats(shortCode, {
      start_date: query.start_date,
      end_date: query.end_date,
      timezone: query.timezone,
    });
  } catch (e) {
    if (e instanceof ApiError && e.isUnauthorized) {
      throw new StatsUnavailableError("This link's stats are password protected.");
    }
    if (e instanceof ApiError && e.isNotFound) {
      throw new StatsUnavailableError(
        "Stats aren't available for this link. It may not exist, or its owner made stats private.",
      );
    }
    throw e;
  }
}
