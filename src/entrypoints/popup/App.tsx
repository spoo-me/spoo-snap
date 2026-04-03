import { QueryClientProvider } from "@tanstack/react-query";
import { Keyboard, Moon, PanelRight, Sun, Terminal } from "lucide-react";
import { useEffect } from "react";
import { AuthSection } from "@/components/auth/AuthSection";
import { UserMenu } from "@/components/auth/UserMenu";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HistoryList } from "@/components/url/HistoryList";
import { ShortenForm } from "@/components/url/ShortenForm";
import { createQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useUiStore } from "@/stores/ui";

const queryClient = createQueryClient();

function PopupContent() {
  const { mode } = useAuthStore();
  const { updateSettings } = useSettingsStore();
  const isDark = document.documentElement.classList.contains("dark");
  const isAuthenticated = mode !== "anonymous";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    updateSettings({ theme: next });
  };

  const openSidePanel = async () => {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: sidePanel/sidebarAction APIs lack type definitions in WXT
      const b = browser as any;
      if (b.sidePanel?.open) {
        // Chrome: sidePanel API
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (tab?.windowId != null) {
          await b.sidePanel.open({ windowId: tab.windowId });
        }
      } else if (b.sidebarAction?.open) {
        // Firefox: sidebarAction API
        await b.sidebarAction.open();
      }
      window.close();
    } catch {
      // Silently fail if neither API is available
    }
  };

  return (
    <div className="w-[380px] h-[560px] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <img src="/icon/logo-black.png" alt="" className="size-4 object-contain dark:hidden" />
          <img src="/icon/favicon.png" alt="" className="hidden size-4 object-contain dark:block" />
          <span className="text-base font-bold tracking-tight">spoo.me</span>
        </div>
        <div className="flex items-center gap-1">
          {!isAuthenticated && <AuthSection />}
          <UserMenu />
          <Button variant="ghost" size="icon-xs" onClick={toggleTheme} title="Toggle theme">
            {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={openSidePanel} title="Open side panel">
            <PanelRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="px-4 py-3">
        <OfflineBanner />
        <ShortenForm />
      </div>

      {/* History */}
      <div className="border-t px-4 py-3 flex-1 flex flex-col min-h-0">
        <h2 className="mb-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">
          Recent
        </h2>
        <div className="overflow-y-auto flex-1">
          <HistoryList limit={8} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Keyboard className="size-3 shrink-0" />
            <span>Shorten current page</span>
          </div>
          <KbdGroup>
            {navigator.platform.includes("Mac") ? (
              <>
                <Kbd>⌃</Kbd>
                <Kbd>⇧</Kbd>
                <Kbd>S</Kbd>
              </>
            ) : (
              <>
                <Kbd>Alt</Kbd>
                <Kbd>Shift</Kbd>
                <Kbd>S</Kbd>
              </>
            )}
          </KbdGroup>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Terminal className="size-3 shrink-0" />
            <span>Omnibox shortener</span>
          </div>
          <KbdGroup>
            <Kbd>spoo</Kbd>
            <span className="text-[10px] text-muted-foreground">+ URL</span>
          </KbdGroup>
        </div>
        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
          <a
            href="https://github.com/spoo-me/spoo-snap"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <span>v2.0.0</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initialize);
  const initSettings = useSettingsStore((s) => s.initialize);
  const setOnline = useUiStore((s) => s.setOnline);

  useEffect(() => {
    const unwatchPromise = initAuth();
    initSettings();

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      unwatchPromise.then((unwatch) => unwatch());
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
