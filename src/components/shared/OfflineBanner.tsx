import { WifiOff } from "lucide-react";
import { useUiStore } from "@/stores/ui";

export function OfflineBanner() {
  const { isOnline } = useUiStore();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <WifiOff className="size-3.5" />
      <span>You're offline. Some features are unavailable.</span>
    </div>
  );
}
