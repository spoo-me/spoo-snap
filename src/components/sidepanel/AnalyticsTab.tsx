import { BarChart3, Search, TrendingUp } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import type { StatsResponse } from "@/api/types";
import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStats } from "@/hooks/use-stats";
import { extractShortCode } from "@/lib/url-utils";
import { useAuthStore } from "@/stores/auth";

export function AnalyticsTab() {
  const { mode } = useAuthStore();
  const isAuthenticated = mode !== "anonymous";

  if (!isAuthenticated) {
    return <UrlAnalytics />;
  }

  return (
    <Tabs defaultValue="account">
      <TabsList className="w-full">
        <TabsTrigger value="account" className="flex-1 text-xs">
          <TrendingUp className="size-3 mr-1" />
          Account
        </TabsTrigger>
        <TabsTrigger value="url" className="flex-1 text-xs">
          <Search className="size-3 mr-1" />
          URL Lookup
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-3">
        <AccountAnalytics />
      </TabsContent>
      <TabsContent value="url" className="mt-3">
        <UrlAnalytics />
      </TabsContent>
    </Tabs>
  );
}

// ── Account-Level Analytics ──────────────────────────────────

function AccountAnalytics() {
  const { data, isLoading, error } = useStats({
    scope: "all",
    group_by: "time,browser,os,country,referrer,short_code",
    metrics: "clicks,unique_clicks",
  });

  if (isLoading) return <SkeletonStats />;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) return null;

  return <StatsDisplay data={data} title="Account Overview" />;
}

// ── Individual URL Analytics ─────────────────────────────────

function UrlAnalytics() {
  const [shortCode, setShortCode] = useState("");
  const [activeCode, setActiveCode] = useState<string | undefined>();

  const { data, isLoading, error } = useStats(
    activeCode
      ? {
          short_code: activeCode,
          group_by: "time,browser,os,country,referrer",
          metrics: "clicks,unique_clicks",
        }
      : {},
    !!activeCode,
  );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = shortCode.trim();
    const code = extractShortCode(trimmed) ?? trimmed.replace(/^https?:\/\/spoo\.me\//, "");
    if (code) setActiveCode(code);
  };

  return (
    <div className="space-y-8 px-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={shortCode}
          onChange={(e) => setShortCode(e.target.value)}
          placeholder="Short code or URL (e.g. abc123)"
          aria-label="Short code or URL"
          className="h-8 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          className="h-8"
          disabled={!shortCode.trim()}
          aria-label="Look up analytics"
        >
          <BarChart3 className="size-3.5" />
        </Button>
      </form>
      {isLoading && <SkeletonStats />}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {data && <StatsDisplay data={data} title={`spoo.me/${activeCode}`} />}
      {!activeCode && !isLoading && (
        <div className="py-8 text-center">
          <BarChart3 className="mx-auto size-8 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">Enter a short code to view analytics</p>
        </div>
      )}
    </div>
  );
}

// ── Stats Display ────────────────────────────────────────────

function StatsDisplay({ data, title }: { data: StatsResponse; title: string }) {
  const m = data.metrics;
  const findMetric = (...candidates: string[]) => {
    for (const key of candidates) {
      if (m[key] && m[key].length > 0) return m[key];
    }
    return null;
  };

  const timeData = findMetric("clicks_by_time", "time", "clicks_over_time");
  const uniqueTimeData = findMetric("unique_clicks_by_time");
  const browserData = findMetric("clicks_by_browser", "browser");
  const osData = findMetric("clicks_by_os", "os");
  const countryData = findMetric("clicks_by_country", "country");
  const referrerData = findMetric("clicks_by_referrer", "referrer");
  const shortCodeData = findMetric("clicks_by_short_code", "short_code");

  return (
    <div className="space-y-8 px-2">
      {/* Summary */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total Clicks" value={fmt(data.summary.total_clicks)} />
          <StatCard label="Unique Clicks" value={fmt(data.summary.unique_clicks)} />
        </div>
        {data.computed_metrics && (
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label="Unique Rate"
              value={`${data.computed_metrics.unique_click_rate.toFixed(1)}%`}
            />
            <StatCard
              label="Repeat Rate"
              value={`${data.computed_metrics.repeat_click_rate.toFixed(1)}%`}
            />
            <StatCard
              label="Avg/Visitor"
              value={data.computed_metrics.average_clicks_per_visitor.toFixed(1)}
            />
          </div>
        )}
      </div>

      {/* Area: Clicks Over Time */}
      {timeData && timeData.length > 1 && (
        <GradientAreaChartCard data={timeData} uniqueData={uniqueTimeData} title={title} />
      )}

      {/* Bar: Top URLs */}
      {shortCodeData && shortCodeData.length > 0 && (
        <HighlightedBarChartCard
          data={shortCodeData}
          title="Top URLs"
          nameKey="short_code"
          chartColor="var(--chart-2)"
        />
      )}

      {/* Pie: Browsers */}
      {browserData && browserData.length > 1 && (
        <RoundedPieChartCard data={browserData} title="Browsers" nameKey="browser" />
      )}
      {browserData && browserData.length === 1 && (
        <HighlightedBarChartCard
          data={browserData}
          title="Browsers"
          nameKey="browser"
          chartColor="var(--chart-3)"
        />
      )}

      {/* Pie: OS */}
      {osData && osData.length > 1 && (
        <RoundedPieChartCard data={osData} title="Operating Systems" nameKey="os" />
      )}
      {osData && osData.length === 1 && (
        <HighlightedBarChartCard
          data={osData}
          title="Operating Systems"
          nameKey="os"
          chartColor="var(--chart-4)"
        />
      )}

      {/* Bar: Countries */}
      {countryData && countryData.length > 0 && (
        <HighlightedBarChartCard
          data={countryData}
          title="Countries"
          nameKey="country"
          chartColor="var(--chart-5)"
        />
      )}

      {/* Bar/Pie: Referrers */}
      {referrerData && referrerData.length > 1 && (
        <RoundedPieChartCard data={referrerData} title="Referrers" nameKey="referrer" />
      )}
      {referrerData && referrerData.length === 1 && (
        <HighlightedBarChartCard
          data={referrerData}
          title="Referrers"
          nameKey="referrer"
          chartColor="var(--chart-4)"
        />
      )}
    </div>
  );
}

// ── Gradient Area Chart (Evil Charts style) ──────────────────

function GradientAreaChartCard({
  data,
  uniqueData,
  title,
}: {
  data: Record<string, unknown>[];
  uniqueData?: Record<string, unknown>[] | null;
  title: string;
}) {
  const keys = Object.keys(data[0] ?? {});
  const dateKey =
    keys.find((k) => k === "date" || k === "time" || k === "clicked_at") ?? keys[0] ?? "";
  const clicksKey = keys.find((k) => k === "clicks" || k === "total_clicks") ?? keys[1] ?? "";

  const uniqueMap = new Map<string, number>();
  if (uniqueData) {
    const uKeys = Object.keys(uniqueData[0] ?? {});
    const uDateKey =
      uKeys.find((k) => k === "date" || k === "time" || k === "clicked_at") ?? uKeys[0] ?? "";
    const uCountKey = uKeys.find((k) => k === "unique_clicks") ?? uKeys[1] ?? "";
    for (const d of uniqueData) uniqueMap.set(String(d[uDateKey] ?? ""), Number(d[uCountKey] ?? 0));
  }

  const chartData = data.map((d) => {
    const raw = String(d[dateKey] ?? "");
    return {
      date: fmtDate(raw),
      total: Number(d[clicksKey] ?? 0),
      ...(uniqueMap.size > 0 ? { unique: uniqueMap.get(raw) ?? 0 } : {}),
    };
  });

  const config: ChartConfig = {
    total: { label: "Total Clicks", color: "var(--chart-1)" },
    ...(uniqueMap.size > 0 ? { unique: { label: "Unique Clicks", color: "var(--chart-2)" } } : {}),
  };

  return (
    <div>
      <h4 className="text-sm font-medium">Clicks Over Time</h4>
      <p className="text-xs text-muted-foreground mb-2">{title}</p>
      <ChartContainer config={config} className="h-48 w-full">
        <AreaChart data={chartData}>
          <rect x="0" y="0" width="100%" height="85%" fill="url(#dots-area)" />
          <defs>
            <DottedBackground id="dots-area" />
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 10 }}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.5} />
              <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="gradUnique" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-unique)" stopOpacity={0.5} />
              <stop offset="95%" stopColor="var(--color-unique)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="total"
            fill="url(#gradTotal)"
            stroke="var(--color-total)"
            strokeWidth={1.5}
          />
          {uniqueMap.size > 0 && (
            <Area
              type="monotone"
              dataKey="unique"
              fill="url(#gradUnique)"
              stroke="var(--color-unique)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          )}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

// ── Highlighted Bar Chart (Evil Charts style) ───────────────────

// Evil Charts dotted background pattern
const DottedBackground = ({ id }: { id: string }) => (
  <pattern id={id} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
    <circle className="dark:text-muted/40 text-muted" cx="2" cy="2" r="1" fill="currentColor" />
  </pattern>
);

function HighlightedBarChartCard({
  data,
  title,
  nameKey,
  chartColor = "var(--chart-1)",
}: {
  data: Record<string, unknown>[];
  title: string;
  nameKey: string;
  chartColor?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const keys = Object.keys(data[0] ?? {});
  const countKey =
    keys.find((k) => k === "clicks" || k === "total_clicks") ??
    keys.find((k) => typeof data[0]?.[k] === "number") ??
    keys[1] ??
    "";

  const chartData = data
    .map((d) => ({
      name: trunc(String(d[nameKey] ?? "Unknown"), 16),
      value: Number(d[countKey] ?? 0),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (chartData.length === 0) return null;

  const config: ChartConfig = { value: { label: "Clicks", color: chartColor } };

  const activeData = activeIndex !== null ? chartData[activeIndex] : null;

  return (
    <div>
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-xs text-muted-foreground mb-2">
        {activeData
          ? `${activeData.name}: ${fmt(activeData.value)} clicks`
          : `${chartData.length} items`}
      </p>
      <ChartContainer
        config={config}
        style={{ height: Math.max(100, chartData.length * 32) }}
        className="w-full"
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 0 }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#dots-bar-${title.replace(/\s/g, "")})`}
          />
          <defs>
            <DottedBackground id={`dots-bar-${title.replace(/\s/g, "")}`} />
          </defs>
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            width={70}
          />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={4}>
            {chartData.map((_, index) => (
              <Cell
                key={chartData[index].name}
                className="transition-opacity duration-200"
                fillOpacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.3}
                stroke={activeIndex === index ? "var(--color-value)" : "none"}
                onMouseEnter={() => setActiveIndex(index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

// ── Rounded Pie Chart (Evil Charts style) ────────────────────

function RoundedPieChartCard({
  data,
  title,
  nameKey,
}: {
  data: Record<string, unknown>[];
  title: string;
  nameKey: string;
}) {
  const keys = Object.keys(data[0] ?? {});
  const countKey =
    keys.find((k) => k === "clicks" || k === "total_clicks") ??
    keys.find((k) => typeof data[0]?.[k] === "number") ??
    keys[1] ??
    "";

  const chartColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  const chartData = data
    .map((d, i) => {
      const key = String(d[nameKey] ?? `item-${i}`)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      return {
        name: trunc(String(d[nameKey] ?? "Unknown"), 16),
        key,
        value: Number(d[countKey] ?? 0),
        fill: `var(--color-${key})`,
      };
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (chartData.length === 0) return null;

  const config: ChartConfig = {
    value: { label: "Clicks" },
    ...Object.fromEntries(
      chartData.map((d, i) => [
        d.key,
        { label: d.name, color: chartColors[i % chartColors.length] },
      ]),
    ),
  };

  return (
    <div className="text-center">
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <ChartContainer
        config={config}
        className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[200px]"
      >
        <PieChart>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#dots-pie-${title.replace(/\s/g, "")})`}
          />
          <defs>
            <DottedBackground id={`dots-pie-${title.replace(/\s/g, "")}`} />
          </defs>
          <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={25}
            cornerRadius={6}
            paddingAngle={3}
          >
            <LabelList
              dataKey="value"
              stroke="none"
              fontSize={11}
              fontWeight={500}
              fill="currentColor"
              formatter={(v: number) => fmt(v)}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      {/* Legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {chartData.map((d) => (
          <div key={d.key} className="flex items-center gap-1.5 text-xs">
            <span className="size-2 rounded-full" style={{ background: config[d.key]?.color }} />
            <span className="text-muted-foreground">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Utilities ────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
        <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
      </div>
      <div className="h-52 rounded-lg bg-muted/30 animate-pulse" />
      <div className="h-36 rounded-lg bg-muted/30 animate-pulse" />
    </div>
  );
}

function fmtDate(date: string): string {
  if (!date) return "";
  try {
    // Append T12:00 to date-only strings so local timezone offset
    // doesn't shift the displayed day (UTC midnight → previous day in US)
    const normalized = date.includes("T") ? date : `${date}T12:00`;
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return date.slice(5);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return date.slice(5);
  }
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function trunc(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
