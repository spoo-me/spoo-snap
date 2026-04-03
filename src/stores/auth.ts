import { create } from "zustand";
import { getMe, refreshAccessToken } from "@/api/auth";
import type { AuthMode, UserProfile } from "@/api/types";
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

  /** Initialize auth state from storage */
  initialize: () => Promise<void>;

  /** Set JWT auth after login */
  setJwtAuth: (accessToken: string, refreshToken: string, user: UserProfile) => Promise<void>;

  /** Set API key auth */
  setApiKeyAuth: (apiKey: string) => Promise<void>;

  /** Clear auth and go anonymous */
  clearAuth: () => Promise<void>;

  /** Update user profile */
  setUser: (user: UserProfile) => Promise<void>;
}

/**
 * Attempt to silently restore a JWT session after browser restart.
 * Session-scoped storage (access token, profile) is cleared on restart,
 * but the refresh token persists in local storage.
 */
async function restoreJwtSession(): Promise<UserProfile | null> {
  try {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;

    const { user } = await getMe();
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
          await Promise.all([
            accessTokenStorage.setValue(null),
            refreshTokenStorage.setValue(null),
            authModeStorage.setValue("anonymous"),
          ]);
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
    authModeStorage.watch((newMode) => {
      if (newMode !== useAuthStore.getState().mode) {
        userProfileStorage.getValue().then((newUser) => {
          set({ mode: newMode, user: newUser });
        });
      }
    });
  },

  setJwtAuth: async (accessToken, refreshToken, user) => {
    await Promise.all([
      accessTokenStorage.setValue(accessToken),
      refreshTokenStorage.setValue(refreshToken),
      userProfileStorage.setValue(user),
      authModeStorage.setValue("jwt"),
      apiKeyStorage.setValue(null),
    ]);
    set({ mode: "jwt", user });
  },

  setApiKeyAuth: async (apiKey) => {
    await Promise.all([
      apiKeyStorage.setValue(apiKey),
      authModeStorage.setValue("apikey"),
      accessTokenStorage.setValue(null),
      refreshTokenStorage.setValue(null),
      userProfileStorage.setValue(null),
    ]);
    set({ mode: "apikey", user: null });
  },

  clearAuth: async () => {
    await Promise.all([
      accessTokenStorage.setValue(null),
      refreshTokenStorage.setValue(null),
      apiKeyStorage.setValue(null),
      userProfileStorage.setValue(null),
      authModeStorage.setValue("anonymous"),
    ]);
    set({ mode: "anonymous", user: null });
  },

  setUser: async (user) => {
    await userProfileStorage.setValue(user);
    set({ user });
  },
}));
