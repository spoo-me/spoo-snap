import { request } from "@/api/client";
import type { ApiKeyActionResponse, ApiKeysListResponse } from "@/api/types";
import { API_V1 } from "@/lib/constants";
import { apiKeyActionResponseSchema, apiKeysListResponseSchema } from "@/schemas/api";

// API key creation is first-party (dashboard) only. Connected-app tokens can
// list and revoke keys but cannot mint them, so no createApiKey is exposed here.

export function listApiKeys(): Promise<ApiKeysListResponse> {
  return request(`${API_V1}/keys`, {}, apiKeysListResponseSchema);
}

export function deleteApiKey(keyId: string, revoke = false): Promise<ApiKeyActionResponse> {
  return request(
    `${API_V1}/keys/${keyId}`,
    { method: "DELETE", params: { revoke } },
    apiKeyActionResponseSchema,
  );
}
