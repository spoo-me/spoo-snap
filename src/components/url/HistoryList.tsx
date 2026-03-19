import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { historyStorage } from "@/lib/storage";
import type { HistoryItem } from "@/schemas/settings";

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryRow({ item }: { item: HistoryItem }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <a
            href={item.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary truncate hover:underline"
          >
            {item.shortUrl.replace("https://", "")}
          </a>
        </div>
        <p className="text-xs text-muted-foreground truncate">{item.originalUrl}</p>
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {formatTime(item.timestamp)}
      </span>
      <div className="flex gap-0.5">
        <Button variant="ghost" size="icon-xs" onClick={handleCopy} title="Copy short URL">
          {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
        </Button>
        <Button variant="ghost" size="icon-xs" asChild title="Open analytics">
          <a href={`https://spoo.me/stats/${item.alias}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export function HistoryList({ limit = 8 }: { limit?: number }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    historyStorage.getValue().then(setHistory);

    // Watch for changes
    const unwatch = historyStorage.watch((newVal) => {
      if (newVal) setHistory(newVal);
    });

    return unwatch;
  }, []);

  const items = history.slice(0, limit);

  if (items.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">No history yet</p>
        <p className="text-xs text-muted-foreground mt-1">Shorten a URL to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <HistoryRow key={`${item.shortUrl}-${item.timestamp}`} item={item} />
      ))}
    </div>
  );
}
