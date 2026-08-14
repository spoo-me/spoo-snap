import { request } from "@/api/client";
import type {
  DeleteUrlResponse,
  ListUrlsQuery,
  UpdateUrlRequest,
  UpdateUrlResponse,
  UpdateUrlStatusRequest,
  UrlListItem,
  UrlListResponse,
} from "@/api/types";
import { API_V1 } from "@/lib/constants";
import {
  deleteUrlResponseSchema,
  updateUrlResponseSchema,
  urlListItemSchema,
  urlListResponseSchema,
} from "@/schemas/api";

export function listUrls(query: ListUrlsQuery = {}): Promise<UrlListResponse> {
  return request(
    `${API_V1}/urls`,
    { params: query as Record<string, string | number | boolean | undefined> },
    urlListResponseSchema,
  );
}

/**
 * Resolve an owned URL by its natural key (domain + alias).
 * 404 covers both unknown aliases and links owned by someone else.
 */
export function getUrlByAddress(domain: string, alias: string): Promise<UrlListItem> {
  return request(
    `${API_V1}/urls/${encodeURIComponent(domain)}/${encodeURIComponent(alias)}`,
    {},
    urlListItemSchema,
  );
}

export function updateUrl(urlId: string, data: UpdateUrlRequest): Promise<UpdateUrlResponse> {
  return request(
    `${API_V1}/urls/${urlId}`,
    { method: "PATCH", body: data },
    updateUrlResponseSchema,
  );
}

export function updateUrlStatus(
  urlId: string,
  data: UpdateUrlStatusRequest,
): Promise<UpdateUrlResponse> {
  return request(
    `${API_V1}/urls/${urlId}/status`,
    { method: "PATCH", body: data },
    updateUrlResponseSchema,
  );
}

export function deleteUrl(urlId: string): Promise<DeleteUrlResponse> {
  return request(`${API_V1}/urls/${urlId}`, { method: "DELETE" }, deleteUrlResponseSchema);
}
