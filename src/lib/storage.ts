import { storage } from "wxt/utils/storage";
import type { AuthMode, UserProfile } from "@/api/types";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { ExtensionSettings, HistoryItem } from "@/schemas/settings";

// ── Auth (session-scoped: cleared on browser close) ──────────

export const accessTokenStorage = storage.defineItem<string | null>("session:accessToken", {
  fallback: null,
});

export const userProfileStorage = storage.defineItem<UserProfile | null>("session:userProfile", {
  fallback: null,
});

// ── Auth (local-scoped: persists across sessions) ────────────

export const refreshTokenStorage = storage.defineItem<string | null>("local:refreshToken", {
  fallback: null,
});

export const apiKeyStorage = storage.defineItem<string | null>("local:apiKey", {
  fallback: null,
});

export const authModeStorage = storage.defineItem<AuthMode>("local:authMode", {
  fallback: "anonymous",
});

// ── Settings ─────────────────────────────────────────────────

export const settingsStorage = storage.defineItem<ExtensionSettings>("local:settings", {
  fallback: DEFAULT_SETTINGS as ExtensionSettings,
});

// ── History ──────────────────────────────────────────────────

export const historyStorage = storage.defineItem<HistoryItem[]>("local:history", {
  fallback: [],
});

// ── Migration ────────────────────────────────────────────────

export const migratedStorage = storage.defineItem<boolean>("local:v2Migrated", {
  fallback: false,
});

// ── Offline Queue ────────────────────────────────────────────

export interface QueuedShorten {
  url: string;
  timestamp: number;
}

export const shortenQueueStorage = storage.defineItem<QueuedShorten[]>("local:shortenQueue", {
  fallback: [],
});
