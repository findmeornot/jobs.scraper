import { useState, useCallback } from "react";
import { RefreshCw, Play, Pause, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useScrape } from "@/hooks/use-scrape";
import { useScrapeStore } from "@/stores/scrape.store";
import { StatsSummary } from "@/components/features/dashboard/stats-summary";
import { AccountDistributionChart } from "@/components/features/dashboard/account-distribution-chart";
import { ContentStatusChart } from "@/components/features/dashboard/content-status-chart";
import { ContentBarChart } from "@/components/features/dashboard/content-bar-chart";
import { ConfirmationRateCard } from "@/components/features/dashboard/confirmation-rate-card";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(dayjs().subtract(1, "day").format("YYYY-MM-DD"));
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const { data: stats, isLoading, isFetching, isPlaceholderData, error, refetch } = useDashboardStats(selectedDate);
  const { isScraping, triggerScrape } = useScrape();
  const isPaused = useScrapeStore((s) => s.isPaused);

  const handleRefresh = useCallback(() => {
    refetch();
    setLastRefreshed(new Date());
  }, [refetch]);

  if (isLoading || (isFetching && isPlaceholderData)) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-sm font-medium">
        Failed to load dashboard stats
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

  const today = dayjs().format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const isYesterday = selectedDate === yesterday;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Updated {dayjs(lastRefreshed).format("HH:mm:ss")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setLastRefreshed(new Date());
            }}
            className="h-8 rounded-lg border border-border px-3 text-xs text-foreground bg-background appearance-none cursor-pointer hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {!isYesterday && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setSelectedDate(yesterday);
                setLastRefreshed(new Date());
              }}
            >
              Yesterday
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={handleRefresh} aria-label="Refresh">
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={triggerScrape} disabled={isScraping}>
            {isScraping ? (
              isPaused ? (
                <>
                  <Pause className="size-4" />
                  Paused
                </>
              ) : (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Scraping...
                </>
              )
            ) : (
              <>
                <Play className="size-4" />
                Trigger Scrape
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 auto-rows-auto">
        <StatsSummary
          totalAccounts={totalAccounts}
          externalAccounts={externalAccounts}
          totalContent={totalContent}
          pending={pending}
          confirmed={confirmed}
        />

        <AccountDistributionChart
          externalAccounts={externalAccounts}
          internalAccounts={internalAccounts}
          totalAccounts={totalAccounts}
        />

        <ConfirmationRateCard
          confirmRate={confirmRate}
          confirmed={confirmed}
          totalContent={totalContent}
          externalAccounts={externalAccounts}
          internalAccounts={internalAccounts}
          pending={pending}
        />

        <ContentBarChart
          totalAccounts={totalAccounts}
          externalAccounts={externalAccounts}
          internalAccounts={internalAccounts}
        />

        <ContentStatusChart
          confirmed={confirmed}
          pending={pending}
          other={other}
          totalContent={totalContent}
        />
      </div>
    </div>
  );
}
