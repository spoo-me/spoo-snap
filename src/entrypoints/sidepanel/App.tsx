import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { AuthSection } from "@/components/auth/AuthSection";
import { UserMenu } from "@/components/auth/UserMenu";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AnalyticsTab } from "@/components/sidepanel/AnalyticsTab";
import { DashboardTab } from "@/components/sidepanel/DashboardTab";
import { SettingsTab } from "@/components/sidepanel/SettingsTab";
import { UrlsTab } from "@/components/sidepanel/UrlsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useUiStore } from "@/stores/ui";

const queryClient = createQueryClient();

function SidePanelContent() {
  const { mode } = useAuthStore();
  const isAuthenticated = mode !== "anonymous";

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <img src="/icon/logo-black.png" alt="" className="size-5 object-contain dark:hidden" />
          <img src="/icon/favicon.png" alt="" className="hidden size-5 object-contain dark:block" />
          spoo.me
        </h1>
        <div className="flex items-center gap-2">
          {!isAuthenticated && <AuthSection />}
          <UserMenu size="md" />
        </div>
      </div>

      <div className="px-4 pt-3">
        <OfflineBanner />
      </div>

      <Tabs defaultValue="dashboard" className="px-4 pt-3 pb-6">
        <TabsList className="w-full">
          <TabsTrigger value="dashboard" className="flex-1 text-xs">
            Dashboard
          </TabsTrigger>
          {isAuthenticated && (
            <TabsTrigger value="urls" className="flex-1 text-xs">
              URLs
            </TabsTrigger>
          )}
          <TabsTrigger value="analytics" className="flex-1 text-xs">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 text-xs">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="dashboard"
          className="mt-4 animate-in fade-in slide-in-from-bottom-1 duration-200"
        >
          <DashboardTab />
        </TabsContent>
        {isAuthenticated && (
          <TabsContent
            value="urls"
            className="mt-4 animate-in fade-in slide-in-from-bottom-1 duration-200"
          >
            <UrlsTab />
          </TabsContent>
        )}
        <TabsContent
          value="analytics"
          className="mt-4 animate-in fade-in slide-in-from-bottom-1 duration-200"
        >
          <AnalyticsTab />
        </TabsContent>
        <TabsContent
          value="settings"
          className="mt-4 animate-in fade-in slide-in-from-bottom-1 duration-200"
        >
          <SettingsTab />
        </TabsContent>
      </Tabs>
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
          <SidePanelContent />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
