import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useStats } from "@/hooks/use-stats";

export function AnalyticsTab() {
  const [shortCode, setShortCode] = useState("");
  const [activeCode, setActiveCode] = useState<string | undefined>();

  const { data, isLoading, error } = useStats(
    activeCode ? { short_code: activeCode, group_by: "browser,os,country" } : {},
    !!activeCode,
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const code = shortCode.trim().replace(/^https?:\/\/spoo\.me\//, "");
    if (code) setActiveCode(code);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={shortCode}
          onChange={(e) => setShortCode(e.target.value)}
          placeholder="Short code or URL (e.g. abc123)"
          className="h-8 text-sm"
        />
        <Button type="submit" size="sm" disabled={!shortCode.trim()}>
          <BarChart3 className="size-3.5" />
        </Button>
      </form>

      {isLoading && (
        <div className="space-y-3">
          {["s1", "s2", "s3"].map((id) => (
            <div key={id} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {data && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Total Clicks" value={data.summary.total_clicks} />
            <StatCard label="Unique Clicks" value={data.summary.unique_clicks} />
          </div>

          {data.computed_metrics && (
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                label="Unique Rate"
                value={`${(data.computed_metrics.unique_click_rate * 100).toFixed(1)}%`}
              />
              <StatCard
                label="Repeat Rate"
                value={`${(data.computed_metrics.repeat_click_rate * 100).toFixed(1)}%`}
              />
              <StatCard
                label="Avg/Visitor"
                value={data.computed_metrics.average_clicks_per_visitor.toFixed(1)}
              />
            </div>
          )}

          {data.summary.first_click && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>First click: {new Date(data.summary.first_click).toLocaleDateString()}</p>
              {data.summary.last_click && (
                <p>Last click: {new Date(data.summary.last_click).toLocaleDateString()}</p>
              )}
            </div>
          )}

          <Separator />

          {/* Metric Breakdowns */}
          {Object.entries(data.metrics).map(([key, values]) => (
            <MetricBreakdown key={key} label={key} values={values} />
          ))}
        </div>
      )}

      {!activeCode && !isLoading && (
        <div className="py-8 text-center">
          <BarChart3 className="mx-auto size-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">Enter a short code to view analytics</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function MetricBreakdown({ label, values }: { label: string; values: Record<string, unknown>[] }) {
  if (values.length === 0) return null;

  // Find the count field (usually "clicks" or "unique_clicks")
  const sampleKeys = Object.keys(values[0] ?? {});
  const countKey = sampleKeys.find((k) => k.includes("click")) ?? sampleKeys[1] ?? "";
  const nameKey = sampleKeys.find((k) => !k.includes("click")) ?? sampleKeys[0] ?? "";

  const maxCount = Math.max(...values.map((v) => Number(v[countKey] ?? 0)));

  return (
    <div>
      <h3 className="mb-2 text-xs font-medium capitalize">{label.replace(/_/g, " ")}</h3>
      <div className="space-y-1.5">
        {values.slice(0, 8).map((v) => {
          const name = String(v[nameKey] ?? "Unknown");
          const count = Number(v[countKey] ?? 0);
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={`${name}-${count}`} className="relative">
              <div
                className="absolute inset-y-0 left-0 rounded bg-primary/10"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between px-2 py-1">
                <span className="text-xs truncate">{name}</span>
                <Badge variant="secondary" className="text-[10px] ml-2">
                  {count}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
