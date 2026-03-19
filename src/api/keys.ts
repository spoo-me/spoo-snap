import { request } from "@/api/client";
import type {
  ApiKeyActionResponse,
  ApiKeyCreatedResponse,
  ApiKeysListResponse,
  CreateApiKeyRequest,
} from "@/api/types";
import { API_V1 } from "@/lib/constants";
import {
  apiKeyActionResponseSchema,
  apiKeyCreatedResponseSchema,
  apiKeysListResponseSchema,
} from "@/schemas/api";

export function createApiKey(data: CreateApiKeyRequest): Promise<ApiKeyCreatedResponse> {
  return request(`${API_V1}/keys`, { method: "POST", body: data }, apiKeyCreatedResponseSchema);
}

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
