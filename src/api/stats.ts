import {
  type AggregateStatsParams,
  type ApiSchema,
  AuthenticationError,
  NotFoundError,
  type StatsDataPoint,
  type StatsParams,
} from "spoo.me";
import { API_BASE_URL } from "@/lib/constants";
import { withSpoo } from "@/lib/spoo";
import { authModeStorage } from "@/lib/storage";

type Schemas = ApiSchema["schemas"];

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
 * The slice of the stats wire the UI renders. The authed aggregate,
 * authed per-link and public endpoints all satisfy it.
 */
export interface StatsData {
  summary: Schemas["StatsSummary"];
  metrics?: Record<string, StatsDataPoint[]>;
  computed_metrics?: Schemas["ComputedMetrics"] | null;
}

/**
 * Account-wide analytics. GET /api/v1/stats — auth required.
 */
export function getAccountStats(params: AggregateStatsParams = {}): Promise<StatsData> {
  return withSpoo((spoo) => spoo.stats.get(params));
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
export async function getUrlStats(shortCode: string, params: StatsParams = {}): Promise<StatsData> {
  const mode = await authModeStorage.getValue();

  if (mode === "jwt" || mode === "apikey") {
    try {
      return await withSpoo(async (spoo) => {
        const url = await spoo.links.getByAddress(new URL(API_BASE_URL).hostname, shortCode);
        return spoo.stats.getForLink(url.id, params);
      });
    } catch (e) {
      // 404 means the link isn't in this account (foreign or unknown) —
      // the public surface is the only remaining read path.
      if (!(e instanceof NotFoundError)) throw e;
    }
  }

  try {
    // The public endpoint returns an {generation, link, stats} envelope;
    // the inner stats object is the same wire shape as the authed
    // endpoints, so we unwrap it here.
    const envelope = await withSpoo((spoo) => spoo.public.stats(shortCode));
    return envelope.stats as unknown as StatsData;
  } catch (e) {
    if (e instanceof AuthenticationError) {
      throw new StatsUnavailableError("This link's stats are password protected.");
    }
    if (e instanceof NotFoundError) {
      throw new StatsUnavailableError(
        "Stats aren't available for this link. It may not exist, or its owner made stats private.",
      );
    }
    throw e;
  }
}
