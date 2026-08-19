import type { Link, UrlId } from "spoo.me";
import { withSpoo } from "@/lib/spoo";

/**
 * Plain serializable snapshot of an SDK Link. The SDK parses timestamps into
 * Date objects; the UI formats and caches ISO strings (smartDate takes
 * strings, and TanStack Query caches should hold plain data).
 */
export interface UrlItem {
  id: UrlId;
  alias: string | null;
  long_url: string | null;
  status: string | null;
  created_at: string | null;
  last_click: string | null;
  expire_after: string | null;
  max_clicks: number | null;
  private_stats: boolean | null;
  block_bots: boolean | null;
  password_set: boolean;
  total_clicks: number | null;
}

/** One page of results, flattened from the SDK's Page object. */
export interface UrlListResult {
  items: UrlItem[];
  page: number;
  total: number;
  hasNext: boolean;
}

export interface ListUrlsParams {
  page?: number;
  pageSize?: number;
  sortBy?: "created_at" | "last_click" | "total_clicks";
  sortOrder?: "ascending" | "descending";
  search?: string;
}

function toUrlItem(link: Link): UrlItem {
  return {
    id: link.id,
    alias: link.alias ?? null,
    long_url: link.long_url ?? null,
    status: link.status ?? null,
    created_at: link.created_at instanceof Date ? link.created_at.toISOString() : null,
    last_click: link.last_click instanceof Date ? link.last_click.toISOString() : null,
    expire_after: link.expire_after instanceof Date ? link.expire_after.toISOString() : null,
    max_clicks: link.max_clicks ?? null,
    private_stats: link.private_stats ?? null,
    block_bots: link.block_bots ?? null,
    password_set: link.password_set,
    total_clicks: link.total_clicks ?? null,
  };
}

export function listUrls(params: ListUrlsParams = {}): Promise<UrlListResult> {
  return withSpoo(async (spoo) => {
    const page = await spoo.links.list({
      ...(params.page !== undefined ? { page: params.page } : {}),
      ...(params.pageSize !== undefined ? { pageSize: params.pageSize } : {}),
      ...(params.sortBy !== undefined ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder !== undefined ? { sortOrder: params.sortOrder } : {}),
      ...(params.search ? { filter: { search: params.search } } : {}),
    });
    return {
      items: page.items.map(toUrlItem),
      page: page.page,
      total: page.total,
      hasNext: page.hasNextPage(),
    };
  });
}

export function updateUrlStatus(urlId: UrlId, status: "ACTIVE" | "INACTIVE") {
  return withSpoo((spoo) => spoo.links.setStatus(urlId, status));
}

export function deleteUrl(urlId: UrlId) {
  return withSpoo((spoo) => spoo.links.delete(urlId));
}
