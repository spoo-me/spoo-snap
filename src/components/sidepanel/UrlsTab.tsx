import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Power,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { UrlListItem } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteUrl, useUpdateUrlStatus, useUrls } from "@/hooks/use-urls";

function UrlRow({ item }: { item: UrlListItem }) {
  const [copied, setCopied] = useState(false);
  const deleteUrl = useDeleteUrl();
  const toggleStatus = useUpdateUrlStatus();

  const shortUrl = `https://spoo.me/${item.alias}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStatus = () => {
    const newStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    toggleStatus.mutate({ urlId: item.id, data: { status: newStatus } });
  };

  const handleDelete = () => {
    if (confirm("Delete this URL? This cannot be undone.")) {
      deleteUrl.mutate(item.id);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline truncate"
            >
              spoo.me/{item.alias}
            </a>
            <Badge
              variant={item.status === "ACTIVE" ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0"
            >
              {item.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.long_url}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{item.total_clicks ?? 0} clicks</span>
          {item.created_at && (
            <span>
              {new Date(item.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-xs" onClick={handleCopy} title="Copy">
            {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleToggleStatus}
            title={item.status === "ACTIVE" ? "Deactivate" : "Activate"}
            disabled={toggleStatus.isPending}
          >
            <Power className="size-3" />
          </Button>
          <Button variant="ghost" size="icon-xs" asChild title="Analytics">
            <a
              href={`https://spoo.me/stats/${item.alias}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-3" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
            title="Delete"
            disabled={deleteUrl.isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UrlsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "total_clicks" | "last_click">("created_at");

  const { data, isLoading, error } = useUrls({
    page,
    page_size: 15,
    sort_by: sortBy,
    sort_order: "descending",
    filter: search || undefined,
  });

  return (
    <div className="space-y-3">
      {/* Search & Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search URLs..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-8 rounded-md border bg-background px-2 text-xs"
        >
          <option value="created_at">Newest</option>
          <option value="total_clicks">Most clicks</option>
          <option value="last_click">Last clicked</option>
        </select>
      </div>

      {/* List */}
      {isLoading && (
        <div className="space-y-2">
          {["s1", "s2", "s3"].map((id) => (
            <div key={id} className="h-20 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {data && (
        <>
          <div className="space-y-2">
            {data.items.map((item) => (
              <UrlRow key={item.id} item={item} />
            ))}
          </div>

          {data.items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No URLs found</p>
          )}

          {/* Pagination */}
          {data.total > 15 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Page {data.page} of {Math.ceil(data.total / data.pageSize)}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="size-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.hasNext}
                >
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
