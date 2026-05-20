import { useState, useCallback } from "react";
import {
  Users,
  Globe,
  Hourglass,
  CheckCircle2,
  Activity,
  Play,
  Pause,
  RefreshCw,
  Loader2,
  TrendingUp,
} from "lucide-react";
import dayjs from "dayjs";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend as RechartLegend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useScrape } from "@/hooks/use-scrape";
import { useScrapeStatus } from "@/hooks/use-scrape-status";
import { cn } from "@/lib/utils";

const accountChartConfig = {
  external: { label: "External", color: "var(--color-chart-1)" },
  internal: { label: "Internal", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

const contentChartConfig = {
  confirmed: { label: "Confirmed", color: "var(--color-chart-2)" },
  pending: { label: "Pending", color: "var(--color-chart-4)" },
  other: { label: "Other", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

const barChartConfig = {
  value: { label: "Accounts", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

// Shared card style
const card = "rounded-2xl border border-border bg-card p-5";

export default function Dashboard() {
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const { stats, loading, error, refetch } = useDashboardStats();
  const { isScraping, triggerScrape } = useScrape();
  const { isPaused } = useScrapeStatus();

  const handleRefresh = useCallback(() => {
    refetch();
    setLastRefreshed(new Date());
  }, [refetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-sm font-medium">
        {error}
      </div>
    );
  }

  const totalAccounts = stats?.total_accounts ?? 0;
  const externalAccounts = stats?.external_accounts ?? 0;
  const internalAccounts = Math.max(0, totalAccounts - externalAccounts);
  const totalContent = stats?.total_content ?? 0;
  const confirmed = stats?.confirmed_content ?? 0;
  const pending = stats?.pending_content ?? 0;
  const other = Math.max(0, totalContent - confirmed - pending);
  const confirmRate = totalContent > 0 ? Math.round((confirmed / totalContent) * 100) : 0;

  const accountPieData = [
    { name: "external", value: externalAccounts, fill: "var(--color-chart-1)" },
    { name: "internal", value: internalAccounts, fill: "var(--color-chart-2)" },
  ].filter((d) => d.value > 0);

  const contentPieData = [
    { name: "confirmed", value: confirmed, fill: "var(--color-chart-2)" },
    { name: "pending", value: pending, fill: "var(--color-chart-4)" },
    { name: "other", value: other, fill: "var(--color-chart-3)" },
  ].filter((d) => d.value > 0);

  const barData = [
    { label: "Total", value: totalAccounts, fill: "var(--color-chart-1)" },
    { label: "External", value: externalAccounts, fill: "var(--color-chart-5)" },
    { label: "Internal", value: internalAccounts, fill: "var(--color-chart-2)" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Updated {dayjs(lastRefreshed).format("HH:mm:ss")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={handleRefresh} aria-label="Refresh">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={triggerScrape} disabled={isScraping}>
            {isScraping
              ? isPaused
                ? <><Pause className="size-4" />Paused</>
                : <><Loader2 className="size-4 animate-spin" />Scraping...</>
              : <><Play className="size-4" />Trigger Scrape</>
            }
          </Button>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-12 gap-3 auto-rows-auto">

        {/* ── Row 1: Stat tiles ── */}
        <StatTile className="col-span-3" label="Total Accounts" value={totalAccounts} icon={Users} accent="bg-chart-1/15 text-chart-1" />
        <StatTile className="col-span-2" label="External" value={externalAccounts} icon={Globe} accent="bg-chart-5/15 text-chart-5" />
        <StatTile className="col-span-2" label="Total Content" value={totalContent} icon={Activity} accent="bg-muted text-muted-foreground" />
        <StatTile className="col-span-2" label="Pending" value={pending} icon={Hourglass} accent="bg-chart-4/15 text-chart-4" />
        <StatTile className="col-span-3" label="Confirmed" value={confirmed} icon={CheckCircle2} accent="bg-chart-2/15 text-chart-2" />

        {/* ── Row 2 ── */}

        {/* Account Types Donut — wide */}
        <div className={cn(card, "col-span-7")}>
          <p className="text-sm font-semibold">Account Distribution</p>
          <p className="text-xs text-muted-foreground mt-0.5">{totalAccounts.toLocaleString()} total accounts registered</p>
          {totalAccounts === 0 ? (
            <EmptyChartPlaceholder />
          ) : (
            <ChartContainer config={accountChartConfig} className="aspect-auto h-52 w-full mt-3">
              <PieChart>
                <RechartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={accountPieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                  {accountPieData.map((e) => <Cell key={e.name} fill={e.fill} />)}
                </Pie>
                <RechartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          )}
        </div>

        {/* Right column: stacked */}
        <div className="col-span-5 flex flex-col gap-3">
          {/* Confirmation rate */}
          <div className={cn(card, "flex-1")}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Confirmation Rate</p>
                <p className="text-xs text-muted-foreground mt-0.5">Content approved out of total</p>
              </div>
              <TrendingUp className="size-4 text-muted-foreground shrink-0" />
            </div>
            <div className="mt-4">
              <div className="text-4xl font-bold tabular-nums">{confirmRate}<span className="text-2xl text-muted-foreground">%</span></div>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-chart-2 transition-all duration-700" style={{ width: `${confirmRate}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>{confirmed.toLocaleString()} confirmed</span>
                <span>{totalContent.toLocaleString()} total</span>
              </div>
            </div>
          </div>

          {/* Quick summary */}
          <div className={cn(card, "flex-1")}>
            <p className="text-sm font-semibold mb-3">Breakdown</p>
            <div className="space-y-2.5">
              {[
                { label: "External accounts", value: externalAccounts, color: "bg-chart-1" },
                { label: "Internal accounts", value: internalAccounts, color: "bg-chart-2" },
                { label: "Pending content", value: pending, color: "bg-chart-4" },
                { label: "Confirmed content", value: confirmed, color: "bg-chart-2" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("size-2 rounded-full shrink-0", item.color)} />
                    <span className="text-xs text-muted-foreground truncate">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3 ── */}

        {/* Bar chart */}
        <div className={cn(card, "col-span-7")}>
          <p className="text-sm font-semibold">Account Breakdown</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total vs type comparison</p>
          <ChartContainer config={barChartConfig} className="aspect-auto h-44 w-full mt-3">
            <BarChart data={barData} barSize={32} margin={{ left: -10, right: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} allowDecimals={false} />
              <RechartTooltip content={<ChartTooltipContent hideLabel />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((e) => <Cell key={e.label} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Content Status Donut */}
        <div className={cn(card, "col-span-5")}>
          <p className="text-sm font-semibold">Content Status</p>
          <p className="text-xs text-muted-foreground mt-0.5">{totalContent.toLocaleString()} total pieces</p>
          {totalContent === 0 ? (
            <EmptyChartPlaceholder />
          ) : (
            <ChartContainer config={contentChartConfig} className="aspect-auto h-44 w-full mt-3">
              <PieChart>
                <RechartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={contentPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                  {contentPieData.map((e) => <Cell key={e.name} fill={e.fill} />)}
                </Pie>
                <RechartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          )}
        </div>

      </div>
    </div>
  );
}

function StatTile({
  className,
  label,
  value,
  icon: Icon,
  accent,
}: {
  className?: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex size-7 items-center justify-center rounded-lg", accent)}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <span className="text-2xl font-bold tabular-nums tracking-tight">{value.toLocaleString()}</span>
    </div>
  );
}

function EmptyChartPlaceholder() {
  return (
    <div className="flex items-center justify-center h-44 mt-3">
      <p className="text-xs text-muted-foreground/60">No data available</p>
    </div>
  );
}
