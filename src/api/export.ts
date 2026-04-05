import type { ExportQuery } from "@/api/types";
import { API_V1 } from "@/lib/constants";
import { isOffline, NetworkError } from "@/lib/errors";
import { accessTokenStorage, apiKeyStorage, authModeStorage } from "@/lib/storage";

/**
 * Export stats as a downloadable file.
 * Returns a Blob since the response is a binary file, not JSON.
 */
export async function exportStats(query: ExportQuery): Promise<Blob> {
  if (isOffline()) throw new NetworkError();

  const url = new URL(`${API_V1}/export`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {};
  const mode = await authModeStorage.getValue();
  if (mode === "apikey") {
    const key = await apiKeyStorage.getValue();
    if (key) headers.Authorization = `Bearer ${key}`;
  } else if (mode === "jwt") {
    const token = await accessTokenStorage.getValue();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), { headers }).catch(() => {
    throw new NetworkError();
  });

  if (!res.ok) {
    throw new Error(`Export failed: ${res.statusText}`);
  }

  return res.blob();
}
