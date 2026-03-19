import { useCallback, useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings";

type ResolvedTheme = "light" | "dark";

export function useTheme() {
  const { settings } = useSettingsStore();
  const themeSetting = settings.theme;

  const getResolved = useCallback((): ResolvedTheme => {
    if (themeSetting === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return themeSetting;
  }, [themeSetting]);

  const [resolved, setResolved] = useState<ResolvedTheme>(getResolved);

  useEffect(() => {
    setResolved(getResolved());

    if (themeSetting !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(getResolved());
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeSetting, getResolved]);

  // Apply to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
  }, [resolved]);

  return { theme: themeSetting, resolved };
}
