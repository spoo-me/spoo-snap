import type { ExtensionSettings } from "@/schemas/settings";
import { useSettingsStore } from "@/stores/settings";

export function useSettings() {
  const { settings, updateSettings, resetSettings, isLoading } = useSettingsStore();

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    updateQr: (patch: Partial<ExtensionSettings["qr"]>) =>
      updateSettings({ qr: { ...settings.qr, ...patch } }),
    updateNotification: (patch: Partial<ExtensionSettings["notification"]>) =>
      updateSettings({ notification: { ...settings.notification, ...patch } }),
    toggleAutoCopy: () => updateSettings({ autoCopy: !settings.autoCopy }),
    toggleAutoShorten: () => updateSettings({ autoShortenOnCopy: !settings.autoShortenOnCopy }),
    setTheme: (theme: ExtensionSettings["theme"]) => updateSettings({ theme }),
  };
}
