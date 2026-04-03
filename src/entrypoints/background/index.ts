import { refreshAccessToken } from "@/api/auth";
import { classicQrUrl, gradientQrUrl } from "@/api/qr";
import { shortenUrl } from "@/api/shorten";
import {
  ACCESS_TOKEN_TTL_MS,
  API_BASE_URL,
  AUTH_ENDPOINTS,
  HISTORY_MAX_ITEMS,
  TOKEN_REFRESH_BUFFER_MS,
} from "@/lib/constants";
import type { ExtensionMessage } from "@/lib/messaging";
import { runMigration } from "@/lib/migration";
import { showToastNotification } from "@/lib/notification";
import {
  accessTokenStorage,
  authModeStorage,
  historyStorage,
  refreshTokenStorage,
  settingsStorage,
  shortenQueueStorage,
  userProfileStorage,
} from "@/lib/storage";
import { isAnyUrl, normalizeUrl } from "@/lib/url-utils";
import { deviceTokenResponseSchema } from "@/schemas/api";
import type { HistoryItem } from "@/schemas/settings";

// ── Helpers ──────────────────────────────────────────────────

async function addToHistory(item: HistoryItem): Promise<void> {
  const history = await historyStorage.getValue();
  const updated = [item, ...history].slice(0, HISTORY_MAX_ITEMS);
  await historyStorage.setValue(updated);
}

async function getQrUrl(text: string): Promise<string | null> {
  const settings = await settingsStorage.getValue();
  if (!settings.qr.enabled) return null;

  if (settings.qr.style === "gradient") {
    return gradientQrUrl({
      content: text,
      start: settings.qr.gradient.start,
      end: settings.qr.gradient.end,
      background: settings.qr.gradient.background,
      direction: settings.qr.gradient.direction,
      style: settings.qr.moduleStyle,
      size: settings.qr.size ?? undefined,
    });
  }

  return classicQrUrl({
    content: text,
    color: settings.qr.classic.color,
    background: settings.qr.classic.background,
    style: settings.qr.moduleStyle,
    size: settings.qr.size ?? undefined,
  });
}

async function copyToClipboard(text: string, tabId?: number): Promise<void> {
  const targetTabId = tabId ?? (await getActiveTabId());
  if (!targetTabId) return;

  try {
    await browser.scripting.executeScript({
      target: { tabId: targetTabId },
      func: (t: string) => navigator.clipboard.writeText(t),
      args: [text],
    });
  } catch {
    // Tab might not be scriptable (e.g. chrome:// pages)
  }
}

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

async function processUrl(url: string, tabId?: number): Promise<void> {
  const normalized = normalizeUrl(url);
  const settings = await settingsStorage.getValue();

  try {
    const result = await shortenUrl({ long_url: normalized });
    const qrText = settings.qr.useOriginalUrl ? normalized : result.short_url;
    const qrUrl = await getQrUrl(qrText);

    // Save to history
    await addToHistory({
      originalUrl: normalized,
      shortUrl: result.short_url,
      alias: result.alias,
      qrUrl,
      timestamp: Date.now(),
    });

    // Auto-copy
    if (settings.autoCopy) {
      await copyToClipboard(result.short_url, tabId);
    }

    // Show notification (unless stealth mode)
    if (!settings.notification.stealthMode) {
      const targetTabId = tabId ?? (await getActiveTabId());
      if (targetTabId) {
        await showToastNotification(
          targetTabId,
          result.short_url,
          qrUrl,
          settings.notification.duration,
          settings.theme,
        );
      }
    }
  } catch (e) {
    // If offline, queue the request
    if (!navigator.onLine) {
      const queue = await shortenQueueStorage.getValue();
      queue.push({ url: normalized, timestamp: Date.now() });
      await shortenQueueStorage.setValue(queue);
      return;
    }
    console.error("Failed to shorten URL:", e);
  }
}

async function processOfflineQueue(): Promise<void> {
  const queue = await shortenQueueStorage.getValue();
  if (queue.length === 0) return;

  await shortenQueueStorage.setValue([]);

  for (const item of queue) {
    try {
      await processUrl(item.url);
    } catch {
      // Items lost if still failing
    }
  }
}

async function handleTokenRefresh(): Promise<void> {
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    // Token expired or invalid — clean up and go anonymous
    const hasRefresh = await refreshTokenStorage.getValue();
    if (hasRefresh) {
      await accessTokenStorage.setValue(null);
      await refreshTokenStorage.setValue(null);
      await authModeStorage.setValue("anonymous");
    }
  }
}

async function exchangeDeviceCode(code: string): Promise<void> {
  const res = await fetch(AUTH_ENDPOINTS.deviceToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Token exchange failed");
  }

  const data = deviceTokenResponseSchema.parse(json);
  await accessTokenStorage.setValue(data.access_token);
  await refreshTokenStorage.setValue(data.refresh_token);
  await userProfileStorage.setValue(data.user);
  await authModeStorage.setValue("jwt");

  // Set up token refresh alarm
  browser.alarms.create("refresh-token", {
    periodInMinutes: (ACCESS_TOKEN_TTL_MS - TOKEN_REFRESH_BUFFER_MS) / 60_000,
  });
}

// ── Main ─────────────────────────────────────────────────────

export default defineBackground(() => {
  // ── Install / Update ─────────────────────────────────────
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "update" || details.reason === "install") {
      await runMigration();
    }

    // Create context menu
    browser.contextMenus.create({
      id: "shorten-link",
      title: "Shorten Link with spoo.me",
      contexts: ["link"],
    });

    // Set up token refresh alarm
    const mode = await authModeStorage.getValue();
    if (mode === "jwt") {
      browser.alarms.create("refresh-token", {
        periodInMinutes: (ACCESS_TOKEN_TTL_MS - TOKEN_REFRESH_BUFFER_MS) / 60_000,
      });
    }
  });

  // ── Context Menu ─────────────────────────────────────────
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "shorten-link" && info.linkUrl) {
      await processUrl(info.linkUrl, tab?.id);
    }
  });

  // ── Message Handler ──────────────────────────────────────
  browser.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === "shorten-url") {
      shortenUrl({ long_url: message.url, alias: message.alias }).then(
        (result) => sendResponse(result),
        (err) => sendResponse({ error: String(err) }),
      );
      return true;
    }

    if (message.type === "get-auth-state") {
      authModeStorage.getValue().then(
        (mode) => sendResponse({ mode }),
        () => sendResponse({ mode: "anonymous" }),
      );
      return true;
    }

    if (message.type === "device-auth-code") {
      // Only accept device auth codes from our own content scripts
      const senderUrl = sender.url ?? "";
      if (!senderUrl.startsWith(API_BASE_URL)) {
        sendResponse({ error: "unauthorized sender" });
        return true;
      }
      exchangeDeviceCode(message.code).then(
        () => {
          sendResponse({ success: true });
          // Close the callback tab
          if (sender.tab?.id) browser.tabs.remove(sender.tab.id).catch(() => {});
        },
        (err) => sendResponse({ error: String(err) }),
      );
      return true;
    }

    return false;
  });

  // ── Omnibox ──────────────────────────────────────────────
  browser.omnibox.onInputEntered.addListener(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const url = isAnyUrl(trimmed) ? trimmed : `https://${trimmed}`;
    await processUrl(url);
  });

  // ── Keyboard Shortcuts ───────────────────────────────────
  browser.commands.onCommand.addListener(async (command) => {
    if (command === "shorten-current") {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.url && isAnyUrl(tab.url)) {
        await processUrl(tab.url, tab.id);
      }
    }
  });

  // ── Alarms (Token Refresh) ───────────────────────────────
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "refresh-token") {
      await processOfflineQueue();
      const mode = await authModeStorage.getValue();
      if (mode === "jwt") {
        await handleTokenRefresh();
      } else {
        browser.alarms.clear("refresh-token");
      }
    }
  });

  // ── Online/Offline ───────────────────────────────────────
  self.addEventListener("online", () => {
    processOfflineQueue();
  });

  console.log("spoo.me background service worker started");
});
