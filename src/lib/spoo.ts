import { AuthenticationError, Spoo } from "spoo.me";
import { API_BASE_URL } from "@/lib/constants";
import { isOffline, NetworkError } from "@/lib/errors";
import { sendMessage } from "@/lib/messaging";
import { accessTokenStorage, apiKeyStorage, authModeStorage } from "@/lib/storage";

let cachedTag: string | undefined;

/**
 * X-Spoo-Client tag identifying this extension to the spoo.me API.
 * Resolved lazily on first client build: browser.runtime.getManifest()
 * must not run at module load time in modules shared across contexts.
 */
export function clientTag(): string {
  cachedTag ??= `snap/${browser.runtime.getManifest().version}`;
  return cachedTag;
}

interface SpooAuth {
  apiKey?: string;
  token?: string | (() => string | Promise<string>);
}

/**
 * Build an SDK client. maxRetries is 0 everywhere: TanStack Query owns
 * retries in the UI and the offline queue owns them in the background —
 * SDK-level retries on top would stack into request storms.
 */
export function makeSpoo(auth: SpooAuth = {}): Spoo {
  return new Spoo({
    baseUrl: API_BASE_URL,
    maxRetries: 0,
    clientTag: clientTag(),
    ...(auth.apiKey !== undefined
      ? {
          apiKey: auth.apiKey,
          // The key is supplied by the user at sign-in and already lives in
          // extension storage; constructing the client with it exposes
          // nothing new. The flag only acknowledges the SDK's guard against
          // shipping a developer's key to arbitrary site visitors.
          dangerouslyAllowBrowser: true,
        }
      : {}),
    ...(auth.token !== undefined ? { token: auth.token } : {}),
  });
}

let uiCache: { key: string; client: Spoo } | null = null;

/**
 * Client for popup/sidepanel contexts. Reads credentials from storage per
 * request and NEVER refreshes tokens itself — the background service worker
 * owns refresh, which keeps token rotation single-writer across contexts.
 * On an expired access token, withSpoo asks the background to refresh and
 * retries once.
 */
export async function getSpoo(): Promise<Spoo> {
  const mode = await authModeStorage.getValue();
  const apiKey = mode === "apikey" ? await apiKeyStorage.getValue() : null;
  const cacheKey = mode === "apikey" ? `apikey:${apiKey ?? ""}` : mode;
  if (uiCache?.key === cacheKey) return uiCache.client;

  let client: Spoo;
  if (mode === "apikey" && apiKey) {
    client = makeSpoo({ apiKey });
  } else if (mode === "jwt") {
    client = makeSpoo({ token: async () => (await accessTokenStorage.getValue()) ?? "" });
  } else {
    client = makeSpoo();
  }
  uiCache = { key: cacheKey, client };
  return client;
}

/** 401 codes a token refresh cannot fix (password-gated public stats). */
const NON_SESSION_401 = new Set(["password_required", "invalid_password"]);

/**
 * True when a 401 means the caller's access token is stale, i.e. a token
 * refresh can fix it. The single policy for every refresh-and-retry path
 * (withSpoo here, bgCall in the background service worker).
 */
export function isStaleSession401(err: unknown): err is AuthenticationError {
  return err instanceof AuthenticationError && !NON_SESSION_401.has(err.code);
}

async function requestBackgroundRefresh(): Promise<boolean> {
  try {
    const res = await sendMessage<{ refreshed?: boolean }>({ type: "refresh-token" });
    return res?.refreshed === true;
  } catch {
    return false;
  }
}

/**
 * Run one SDK call with the extension's cross-cutting behavior: the offline
 * gate, plus refresh-and-retry-once when the access token has expired.
 */
export async function withSpoo<T>(fn: (spoo: Spoo) => Promise<T>): Promise<T> {
  if (isOffline()) throw new NetworkError();
  try {
    return await fn(await getSpoo());
  } catch (err) {
    if (
      isStaleSession401(err) &&
      (await authModeStorage.getValue()) === "jwt" &&
      (await requestBackgroundRefresh())
    ) {
      return fn(await getSpoo());
    }
    throw err;
  }
}
