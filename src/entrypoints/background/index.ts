import { AuthenticationError, SessionExpiredError, type Spoo, type TokenProvider } from "spoo.me";
import { gradientQrUrl } from "@/api/qr";
import { API_BASE_URL, HISTORY_MAX_ITEMS, QR_BRAND } from "@/lib/constants";
import type { ExtensionMessage } from "@/lib/messaging";
import { runMigration } from "@/lib/migration";
import { showToastNotification } from "@/lib/notification";
import { makeSpoo } from "@/lib/spoo";
import {
  accessTokenStorage,
  apiKeyStorage,
  authModeStorage,
  clearJwtSession,
  deviceAuthVerifierStorage,
  historyStorage,
  refreshTokenStorage,
  settingsStorage,
  shortenQueueStorage,
  userProfileStorage,
} from "@/lib/storage";
import { isAnyUrl, normalizeUrl } from "@/lib/url-utils";
import type { HistoryItem } from "@/schemas/settings";

// ── SDK clients ──────────────────────────────────────────────
//
// The background service worker is the ONLY context that ever refreshes
// tokens: it owns the SDK's oauth.tokenProvider, and popup/sidepanel clients
// ask it to refresh via the "refresh-token" message. Single-writer rotation
// means two contexts can never race each other out of a valid refresh token.

const REFRESH_ALARM = "refresh-token";
/** Refresh this long before the access token's exp claim. */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

let anonClient: Spoo | undefined;

function getAnonSpoo(): Spoo {
  anonClient ??= makeSpoo();
  return anonClient;
}

/** Read the exp claim (as epoch ms) of a JWT without verifying it. */
function readJwtExpMs(token: string): number | undefined {
  const part = token.split(".")[1];
  if (!part) return undefined;
  try {
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

/**
 * (Re)schedule the refresh alarm from the access token's actual lifetime
 * instead of assuming a fixed TTL. Minimum 1 minute; when the exp claim is
 * unreadable, fall back to a conservative 10 minutes.
 */
async function scheduleRefreshAlarm(accessToken: string): Promise<void> {
  const expMs = readJwtExpMs(accessToken);
  const periodInMinutes =
    expMs !== undefined ? Math.max(1, (expMs - Date.now() - REFRESH_BUFFER_MS) / 60_000) : 10;
  browser.alarms.create(REFRESH_ALARM, { periodInMinutes });
}

let session: { provider: TokenProvider; client: Spoo } | null = null;

/**
 * The background's JWT session: an SDK tokenProvider seeded from storage
 * that persists every rotation back to storage. Rebuilt lazily after each
 * service-worker restart.
 */
async function getSession(): Promise<{ provider: TokenProvider; client: Spoo } | null> {
  if ((await authModeStorage.getValue()) !== "jwt") {
    session = null;
    return null;
  }
  if (session) return session;

  const refreshToken = await refreshTokenStorage.getValue();
  if (!refreshToken) return null;
  const accessToken = (await accessTokenStorage.getValue()) ?? "";

  const provider = getAnonSpoo().oauth.tokenProvider({
    tokens: { access_token: accessToken, refresh_token: refreshToken },
    onRefresh: async (tokens) => {
      await accessTokenStorage.setValue(tokens.access_token);
      await refreshTokenStorage.setValue(tokens.refresh_token);
      await scheduleRefreshAlarm(tokens.access_token);
    },
  });
  // After a browser restart the session-scoped access token is gone while
  // the refresh token persists; force the first call to refresh.
  if (!accessToken) provider.invalidate();

  session = { provider, client: makeSpoo({ token: provider }) };
  return session;
}

let refreshInflight: Promise<boolean> | null = null;

/**
 * Force a token refresh now. Returns false on transient failure (tokens are
 * kept for a later retry) and clears the session on a definitive rejection.
 */
function requestRefresh(): Promise<boolean> {
  refreshInflight ??= (async () => {
    const current = await getSession();
    if (!current) return false;
    try {
      current.provider.invalidate();
      await current.provider();
      return true;
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        // Grant revoked or refresh token expired — clear the session so we
        // don't keep retrying a dead grant. The storage watch propagates
        // the sign-out to any open UI.
        session = null;
        await clearJwtSession();
        await browser.alarms.clear(REFRESH_ALARM);
      }
      return false;
    }
  })().finally(() => {
    refreshInflight = null;
  });
  return refreshInflight;
}

/** Client matching the current auth mode, for background-initiated calls. */
async function getBgSpoo(): Promise<Spoo> {
  const mode = await authModeStorage.getValue();
  if (mode === "jwt") {
    const current = await getSession();
    if (current) return current.client;
  }
  if (mode === "apikey") {
    const key = await apiKeyStorage.getValue();
    if (key) return makeSpoo({ apiKey: key });
  }
  return getAnonSpoo();
}

/**
 * Run one background SDK call; on an expired access token, refresh through
 * the session provider and retry once.
 */
async function bgCall<T>(fn: (spoo: Spoo) => Promise<T>): Promise<T> {
  try {
    return await fn(await getBgSpoo());
  } catch (err) {
    if (
      err instanceof AuthenticationError &&
      (await authModeStorage.getValue()) === "jwt" &&
      (await requestRefresh())
    ) {
      return fn(await getBgSpoo());
    }
    throw err;
  }
}

// ── Helpers ──────────────────────────────────────────────────

async function addToHistory(item: HistoryItem): Promise<void> {
  const history = await historyStorage.getValue();
  const updated = [item, ...history].slice(0, HISTORY_MAX_ITEMS);
  await historyStorage.setValue(updated);
}

async function getQrUrl(text: string): Promise<string | null> {
  const settings = await settingsStorage.getValue();
  if (!settings.qr.enabled) return null;

  // Match the dashboard's branded gradient QR style
  return gradientQrUrl({ content: text, ...QR_BRAND });
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
    const result = await bgCall((spoo) => spoo.links.create({ long_url: normalized }));
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
    // If offline, queue the request (connection failures surface as the
    // SDK's APIConnectionError, but navigator.onLine is the gate we trust)
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

async function exchangeDeviceCode(code: string): Promise<void> {
  const codeVerifier = await deviceAuthVerifierStorage.getValue();
  if (!codeVerifier) {
    throw new Error("Missing PKCE verifier — please start sign in again");
  }

  const tokens = await getAnonSpoo().oauth.exchangeCode({ code, codeVerifier });

  await Promise.all([
    accessTokenStorage.setValue(tokens.access_token),
    refreshTokenStorage.setValue(tokens.refresh_token),
    userProfileStorage.setValue(tokens.user),
    deviceAuthVerifierStorage.setValue(null),
  ]);
  await authModeStorage.setValue("jwt");
  session = null; // rebuild the provider from the fresh token pair

  await scheduleRefreshAlarm(tokens.access_token);
}

// ── Main ─────────────────────────────────────────────────────

export default defineBackground(() => {
  // Any auth-mode change (sign-out from the UI, new sign-in) invalidates the
  // cached session provider so it can't refresh with stale tokens.
  authModeStorage.watch(() => {
    session = null;
  });

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
      const accessToken = (await accessTokenStorage.getValue()) ?? "";
      await scheduleRefreshAlarm(accessToken);
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
      bgCall((spoo) =>
        spoo.links.create({
          long_url: message.url,
          ...(message.alias ? { alias: message.alias } : {}),
        }),
      ).then(
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

    if (message.type === "refresh-token") {
      // UI contexts never refresh on their own; they ask here and retry.
      requestRefresh().then(
        (refreshed) => sendResponse({ refreshed }),
        () => sendResponse({ refreshed: false }),
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
    if (alarm.name === REFRESH_ALARM) {
      await processOfflineQueue();
      const mode = await authModeStorage.getValue();
      if (mode === "jwt") {
        // A revoked grant or expired refresh token clears the session inside
        // requestRefresh. Transient failures leave it intact to retry on the
        // next alarm.
        await requestRefresh();
      } else {
        browser.alarms.clear(REFRESH_ALARM);
      }
    }
  });

  // ── Online/Offline ───────────────────────────────────────
  self.addEventListener("online", () => {
    processOfflineQueue();
  });

  console.log("spoo.me background service worker started");
});
