import { QueryClientProvider } from "@tanstack/react-query";
import { Moon, PanelRight, Sun } from "lucide-react";
import { useEffect } from "react";
import { AuthSection } from "@/components/auth/AuthSection";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HistoryList } from "@/components/url/HistoryList";
import { ShortenForm } from "@/components/url/ShortenForm";
import { createQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useUiStore } from "@/stores/ui";

const queryClient = createQueryClient();

function PopupContent() {
  const { updateSettings } = useSettingsStore();
  const isDark = document.documentElement.classList.contains("dark");

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    updateSettings({ theme: next });
  };

  const openSidePanel = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId != null) {
      // biome-ignore lint/suspicious/noExplicitAny: sidePanel API lacks type definitions in WXT
      await (browser as any).sidePanel.open({ windowId: tab.windowId });
      window.close();
    }
  };

  return (
    <div className="w-[380px] bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight">spoo.me</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={toggleTheme} title="Toggle theme">
            {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={openSidePanel} title="Open side panel">
            <PanelRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-4">
        <OfflineBanner />

        {/* Auth */}
        <AuthSection />

        <Separator />

        {/* Shorten */}
        <ShortenForm />

        <Separator />

        {/* History */}
        <div>
          <h2 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recent
          </h2>
          <HistoryList limit={6} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-4 py-2">
        <a
          href="https://github.com/spoo-me/spoo-snap"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          GitHub
        </a>
        <span className="text-[10px] text-muted-foreground">v2.0.0</span>
      </div>
    </div>
  );
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initialize);
  const initSettings = useSettingsStore((s) => s.initialize);
  const setOnline = useUiStore((s) => s.setOnline);

  useEffect(() => {
    initAuth();
    initSettings();

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [initAuth, initSettings, setOnline]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <PopupContent />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
