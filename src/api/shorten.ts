import { request } from "@/api/client";
import type { CreateUrlRequest, UrlResponse } from "@/api/types";
import { API_V1 } from "@/lib/constants";
import { urlResponseSchema } from "@/schemas/api";

export function shortenUrl(data: CreateUrlRequest): Promise<UrlResponse> {
  return request(`${API_V1}/shorten`, { method: "POST", body: data }, urlResponseSchema);
}
