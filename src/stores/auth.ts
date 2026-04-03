import { create } from "zustand";
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

export const useAuthStore = create<AuthState>((set) => ({
  mode: "anonymous",
  user: null,
  isLoading: true,

  initialize: async () => {
    const [mode, user] = await Promise.all([
      authModeStorage.getValue(),
      userProfileStorage.getValue(),
    ]);
    set({ mode, user, isLoading: false });

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
    ]);
    set({ mode: "jwt", user });
  },

  setApiKeyAuth: async (apiKey) => {
    await Promise.all([
      apiKeyStorage.setValue(apiKey),
      authModeStorage.setValue("apikey"),
      // Clear any JWT state
      accessTokenStorage.setValue(null),
      refreshTokenStorage.setValue(null),
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
