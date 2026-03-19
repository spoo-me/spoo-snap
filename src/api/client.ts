import type { ApiErrorResponse } from "@/api/types";
import { AUTH_ENDPOINTS } from "@/lib/constants";
import { ApiError, isOffline, NetworkError } from "@/lib/errors";
import {
  accessTokenStorage,
  apiKeyStorage,
  authModeStorage,
  refreshTokenStorage,
} from "@/lib/storage";
import { refreshResponseSchema } from "@/schemas/api";

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  /** Skip auth header injection */
  noAuth?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

async function getAuthHeader(): Promise<string | null> {
  const mode = await authModeStorage.getValue();

  if (mode === "apikey") {
    const key = await apiKeyStorage.getValue();
    if (key) return `Bearer ${key}`;
  }

  if (mode === "jwt") {
    const token = await accessTokenStorage.getValue();
    if (token) return `Bearer ${token}`;
  }

  return null;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await refreshTokenStorage.getValue();
  if (!refreshToken) return null;

  try {
    const res = await fetch(AUTH_ENDPOINTS.refresh, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!res.ok) {
      // Refresh failed — clear auth state
      await accessTokenStorage.setValue(null);
      await refreshTokenStorage.setValue(null);
      await authModeStorage.setValue("anonymous");
      return null;
    }

    const data = refreshResponseSchema.parse(await res.json());
    await accessTokenStorage.setValue(data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Core HTTP request function with auth injection, token refresh, and error handling.
 */
export async function request<T>(
  url: string,
  options: RequestOptions = {},
  schema?: { parse: (data: unknown) => T },
): Promise<T> {
  if (isOffline()) {
    throw new NetworkError();
  }

  const { method = "GET", body, params, headers = {}, noAuth = false } = options;

  // Build URL with query params
  const requestUrl = new URL(url);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        requestUrl.searchParams.set(key, String(value));
      }
    }
  }

  // Auth header
  if (!noAuth) {
    const authHeader = await getAuthHeader();
    if (authHeader) {
      headers.Authorization = authHeader;
    }
  }

  // Content type
  if (body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  let res = await fetch(requestUrl.toString(), fetchOptions).catch(() => {
    throw new NetworkError();
  });

  // Handle 401 — try token refresh once
  if (res.status === 401 && !noAuth) {
    const mode = await authModeStorage.getValue();
    if (mode === "jwt") {
      // Deduplicate concurrent refresh calls
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(requestUrl.toString(), {
          ...fetchOptions,
          headers,
        }).catch(() => {
          throw new NetworkError();
        });
      }
    }
  }

  // Handle errors
  if (!res.ok) {
    const retryAfter = res.headers.get("Retry-After");
    let errorBody: ApiErrorResponse;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = {
        error: res.statusText || "Unknown error",
        code: "UNKNOWN",
      };
    }
    throw new ApiError(res.status, errorBody, retryAfter ? Number(retryAfter) : undefined);
  }

  const json = await res.json();
  return schema ? schema.parse(json) : (json as T);
}
