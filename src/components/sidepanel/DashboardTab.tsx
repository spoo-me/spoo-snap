import { Separator } from "@/components/ui/separator";
import { HistoryList } from "@/components/url/HistoryList";
import { ShortenForm } from "@/components/url/ShortenForm";

export function DashboardTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-sm font-medium">Shorten a URL</h2>
        <ShortenForm />
      </div>

      <Separator />

      <div>
        <h2 className="mb-2 text-sm font-medium">Recent History</h2>
        <HistoryList limit={10} />
      </div>
    </div>
  );
}
