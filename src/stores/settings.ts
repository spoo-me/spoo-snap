import { create } from "zustand";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { settingsStorage } from "@/lib/storage";
import type { ExtensionSettings } from "@/schemas/settings";

interface SettingsState {
  settings: ExtensionSettings;
  isLoading: boolean;

  /** Initialize settings from storage */
  initialize: () => Promise<void>;

  /** Update settings (partial merge) */
  updateSettings: (patch: Partial<ExtensionSettings>) => Promise<void>;

  /** Reset to defaults */
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS as ExtensionSettings,
  isLoading: true,

  initialize: async () => {
    const settings = await settingsStorage.getValue();
    set({ settings, isLoading: false });
  },

  updateSettings: async (patch) => {
    const merged = { ...get().settings, ...patch };
    await settingsStorage.setValue(merged);
    set({ settings: merged });
  },

  resetSettings: async () => {
    const defaults = DEFAULT_SETTINGS as ExtensionSettings;
    await settingsStorage.setValue(defaults);
    set({ settings: defaults });
  },
}));
