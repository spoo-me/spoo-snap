import { DEFAULT_SETTINGS, HISTORY_MAX_ITEMS } from "@/lib/constants";
import { historyStorage, migratedStorage, settingsStorage } from "@/lib/storage";
import { extractShortCode } from "@/lib/url-utils";
import type { ExtensionSettings, HistoryItem } from "@/schemas/settings";
import { oldHistorySchema, oldSettingsSchema } from "@/schemas/storage";

/**
 * Convert old RGB tuple string "(r,g,b)" to hex color "#rrggbb".
 */
function rgbTupleToHex(rgb: string): string {
  const match = rgb.match(/\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/);
  if (!match) return rgb; // Return as-is if not a tuple
  const [, r, g, b] = match;
  return `#${Number(r).toString(16).padStart(2, "0")}${Number(g).toString(16).padStart(2, "0")}${Number(b).toString(16).padStart(2, "0")}`;
}

/**
 * Migrate old v1 settings to v2 format.
 */
function migrateSettings(old: Record<string, unknown>): ExtensionSettings {
  const parsed = oldSettingsSchema.safeParse(old);
  if (!parsed.success) return DEFAULT_SETTINGS as ExtensionSettings;

  const v1 = parsed.data;
  return {
    qr: {
      enabled: v1.enableQr ?? true,
      useOriginalUrl: v1.useOriginalUrl ?? false,
      style: v1.qrStyle === "gradient" ? "gradient" : "classic",
      classic: {
        color: v1.qrColor ? rgbTupleToHex(v1.qrColor) : "black",
        background: v1.qrBackground ? rgbTupleToHex(v1.qrBackground) : "white",
      },
      gradient: {
        start: v1.qrGradient1 ? rgbTupleToHex(v1.qrGradient1) : "#6a1a4c",
        end: v1.qrGradient2 ? rgbTupleToHex(v1.qrGradient2) : "#40353c",
        background: "#ffffff",
        direction: "vertical",
      },
      moduleStyle: "rounded",
      size: null,
    },
    notification: {
      duration: v1.notificationDuration
        ? Math.min(60, Math.max(1, Math.round(v1.notificationDuration / 1000)))
        : 30,
      stealthMode: v1.stealthMode ?? false,
    },
    autoCopy: v1.autoCopy ?? true,
    autoShortenOnCopy: false, // Opt-in only in v2
    theme: v1.theme === "dark" ? "dark" : v1.theme === "light" ? "light" : "system",
  };
}

/**
 * Migrate old v1 history to v2 format.
 */
function migrateHistory(old: unknown[]): HistoryItem[] {
  const parsed = oldHistorySchema.safeParse(old);
  if (!parsed.success) return [];

  return parsed.data
    .map((item) => ({
      originalUrl: item.originalUrl,
      shortUrl: item.shortUrl,
      alias: extractShortCode(item.shortUrl) ?? item.shortUrl,
      qrUrl: item.qrUrl ?? null,
      timestamp: item.timestamp,
    }))
    .slice(0, HISTORY_MAX_ITEMS);
}

/**
 * Run migration from old v1 storage format to v2.
 * Safe to call multiple times — will only run once.
 */
export async function runMigration(): Promise<void> {
  const alreadyMigrated = await migratedStorage.getValue();
  if (alreadyMigrated) return;

  try {
    // Read old storage keys directly
    const oldData = await browser.storage.local.get(["settings", "history"]);

    if (oldData.settings && typeof oldData.settings === "object") {
      const newSettings = migrateSettings(oldData.settings as Record<string, unknown>);
      await settingsStorage.setValue(newSettings);
    }

    if (Array.isArray(oldData.history)) {
      const newHistory = migrateHistory(oldData.history);
      if (newHistory.length > 0) {
        await historyStorage.setValue(newHistory);
      }
    }

    // Clean up old keys
    await browser.storage.local.remove(["settings", "history"]);
  } catch (e) {
    console.error("Migration failed:", e);
  }

  await migratedStorage.setValue(true);
}
