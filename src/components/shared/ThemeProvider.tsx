import { type ReactNode, useEffect } from "react";
import { useSettingsStore } from "@/stores/settings";

/**
 * Applies the theme class to the document root.
 * Must be rendered in every UI entrypoint (popup, sidepanel).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettingsStore();
  const theme = settings.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isDark ? "dark" : "light");
      root.style.colorScheme = isDark ? "dark" : "light";

      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
        root.style.colorScheme = e.matches ? "dark" : "light";
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    root.classList.add(theme);
    root.style.colorScheme = theme;
  }, [theme]);

  return <>{children}</>;
}
