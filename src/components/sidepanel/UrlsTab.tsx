import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Play,
  Power,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { UrlListItem } from "@/api/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeleteUrl, useUpdateUrlStatus, useUrls } from "@/hooks/use-urls";
import { smartDate } from "@/lib/format-date";

type SortOption = "created_at" | "total_clicks" | "last_click";

const STATUS_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  BLOCKED: "destructive",
  EXPIRED: "warning",
  INACTIVE: "secondary",
};

function UrlRow({ item, sortBy }: { item: UrlListItem; sortBy: SortOption }) {
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

  const handleDelete = () => deleteUrl.mutate(item.id);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline truncate block"
          >
            spoo.me/{item.alias}
          </a>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.long_url}</p>
        </div>
        {item.status && item.status !== "ACTIVE" && (
          <Badge
            variant={STATUS_VARIANT[item.status] ?? "secondary"}
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {item.status}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{item.total_clicks ?? 0} clicks</span>
          {sortBy === "last_click" && item.last_click ? (
            <span>{smartDate(item.last_click)}</span>
          ) : (
            item.created_at && <span>{smartDate(item.created_at)}</span>
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
            {item.status === "ACTIVE" ? <Power className="size-3" /> : <Play className="size-3" />}
          </Button>
          <Button variant="ghost" size="icon-xs" asChild title="Open original URL">
            <a href={item.long_url ?? "#"} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3" />
            </a>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                title="Delete"
                disabled={deleteUrl.isPending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete URL</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>spoo.me/{item.alias}</strong>. This cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export function UrlsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const VALID_SORTS: SortOption[] = ["created_at", "total_clicks", "last_click"];
  const [sortBy, setSortByState] = useState<SortOption>(() => {
    const saved = localStorage.getItem("spoo-urls-sort");
    return saved && VALID_SORTS.includes(saved as SortOption)
      ? (saved as SortOption)
      : "created_at";
  });
  const setSortBy = (v: SortOption) => {
    setSortByState(v);
    localStorage.setItem("spoo-urls-sort", v);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // filter param must be JSON-encoded UrlFilter: {"search": "..."}
  const filterParam = debouncedSearch ? JSON.stringify({ search: debouncedSearch }) : undefined;

  const { data, isLoading, error } = useUrls({
    page,
    pageSize: 15,
    sortBy,
    sortOrder: "descending",
    filter: filterParam,
  });

  return (
    <div className="space-y-3">
      {/* Search & Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search URLs..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Newest</SelectItem>
            <SelectItem value="total_clicks">Most clicks</SelectItem>
            <SelectItem value="last_click">Last clicked</SelectItem>
          </SelectContent>
        </Select>
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
              <UrlRow key={item.id} item={item} sortBy={sortBy} />
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
