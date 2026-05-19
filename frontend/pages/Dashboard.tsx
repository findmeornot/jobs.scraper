import {
  Users,
  Globe,
  Hourglass,
  CheckCircle2,
  Activity,
  Play,
  RefreshCw,
  Loader2,
} from "lucide-react";
import StatCard from "../components/stat-card";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useScrape } from "@/hooks/use-scrape";

export default function Dashboard() {
  const { stats, loading, error, refetch } = useDashboardStats();
  const { isScraping, triggerScrape } = useScrape();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-48 text-muted-foreground"
        role="status"
        aria-label="Loading dashboard statistics"
      >
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-4 text-sm font-medium"
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your Instagram scraper
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={refetch}
          aria-label="Refresh stats"
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Accounts"
          value={stats?.total_accounts ?? 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="External"
          value={stats?.external_accounts ?? 0}
          icon={Globe}
          color="purple"
        />
        <StatCard
          label="Total Content"
          value={stats?.total_content ?? 0}
          icon={Activity}
          color="default"
        />
        <StatCard
          label="Pending"
          value={stats?.pending_content ?? 0}
          icon={Hourglass}
          color="yellow"
        />
        <StatCard
          label="Confirmed"
          value={stats?.confirmed_content ?? 0}
          icon={CheckCircle2}
          color="green"
        />
      </div>

      <div className="bg-card text-card-foreground rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
        <div className="flex gap-3">
          <Button
            onClick={triggerScrape}
            disabled={isScraping}
            aria-busy={isScraping}
          >
            {isScraping ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Play className="size-4" />
                Trigger Scrape
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
