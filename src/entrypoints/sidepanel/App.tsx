import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AccountTab } from "@/components/sidepanel/AccountTab";
import { AnalyticsTab } from "@/components/sidepanel/AnalyticsTab";
import { DashboardTab } from "@/components/sidepanel/DashboardTab";
import { QrTab } from "@/components/sidepanel/QrTab";
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
      <div className="border-b px-4 py-3">
        <h1 className="text-lg font-bold tracking-tight">spoo.me</h1>
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
          <TabsTrigger value="qr" className="flex-1 text-xs">
            QR
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 text-xs">
            Settings
          </TabsTrigger>
          {isAuthenticated && (
            <TabsTrigger value="account" className="flex-1 text-xs">
              Account
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab />
        </TabsContent>
        {isAuthenticated && (
          <TabsContent value="urls" className="mt-4">
            <UrlsTab />
          </TabsContent>
        )}
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="qr" className="mt-4">
          <QrTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
        {isAuthenticated && (
          <TabsContent value="account" className="mt-4">
            <AccountTab />
          </TabsContent>
        )}
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
