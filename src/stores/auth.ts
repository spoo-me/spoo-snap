import { create } from "zustand";
import type { AuthMode, UserProfile } from "@/api/types";
import { sendMessage } from "@/lib/messaging";
import { withSpoo } from "@/lib/spoo";
import {
  accessTokenStorage,
  apiKeyStorage,
  authModeStorage,
  refreshTokenStorage,
  userProfileStorage,
} from "@/lib/storage";

interface AuthState {
  mode: AuthMode;
  user: UserProfile | null;
  isLoading: boolean;

  /** Initialize auth state from storage. Returns cleanup function to unsubscribe watchers. */
  initialize: () => Promise<() => void>;

  /** Set API key auth */
  setApiKeyAuth: (apiKey: string) => Promise<void>;

  /** Clear auth and go anonymous */
  clearAuth: () => Promise<void>;
}

/**
 * Attempt to silently restore a JWT session after browser restart.
 * Session-scoped storage (access token, profile) is cleared on restart,
 * but the refresh token persists in local storage. The background service
 * worker owns all token refreshes, so we ask it to refresh and then load
 * the profile through the SDK.
 */
async function restoreJwtSession(): Promise<UserProfile | null> {
  try {
    const res = await sendMessage<{ refreshed?: boolean }>({ type: "refresh-token" });
    if (res?.refreshed !== true) return null;

    const user = await withSpoo((spoo) => spoo.auth.me());
    await userProfileStorage.setValue(user);
    return user;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  mode: "anonymous",
  user: null,
  isLoading: true,

  initialize: async () => {
    try {
      const [mode, user] = await Promise.all([
        authModeStorage.getValue(),
        userProfileStorage.getValue(),
      ]);

      // JWT session data is session-scoped — after a browser restart the
      // access token and profile are gone but the refresh token survives.
      if (mode === "jwt" && !user) {
        const restored = await restoreJwtSession();
        if (restored) {
          set({ mode: "jwt", user: restored, isLoading: false });
        } else {
          // A revoked grant / expired refresh token is cleared by the
          // background (definitive 401 on refresh). A transient failure
          // leaves the stored session untouched so a later launch can
          // retry; we fall back to anonymous in memory for now without
          // wiping the stored session.
          set({ mode: "anonymous", user: null, isLoading: false });
        }
      } else {
        set({ mode, user, isLoading: false });
      }
    } catch (e) {
      console.error("Auth initialization failed:", e);
      set({ mode: "anonymous", user: null, isLoading: false });
    }

    // Watch for auth changes from the background script (e.g., device auth flow)
    const unwatch = authModeStorage.watch((newMode) => {
      if (newMode !== useAuthStore.getState().mode) {
        userProfileStorage.getValue().then((newUser) => {
          set({ mode: newMode, user: newUser });
        });
      }
    });

    return unwatch;
  },

  setApiKeyAuth: async (apiKey) => {
    await Promise.all([
      apiKeyStorage.setValue(apiKey),
      accessTokenStorage.setValue(null),
      refreshTokenStorage.setValue(null),
      userProfileStorage.setValue(null),
    ]);
    await authModeStorage.setValue("apikey");
    set({ mode: "apikey", user: null });
  },

  clearAuth: async () => {
    await Promise.all([
      accessTokenStorage.setValue(null),
      refreshTokenStorage.setValue(null),
      apiKeyStorage.setValue(null),
      userProfileStorage.setValue(null),
    ]);
    await authModeStorage.setValue("anonymous");
    set({ mode: "anonymous", user: null });
  },
}));
