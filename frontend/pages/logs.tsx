import { useMemo, useEffect } from "react";
import { ScrollText } from "lucide-react";
import { useScrapeStore } from "@/stores/scrape.store";
import { useScrape } from "@/hooks/use-scrape";
import { useSessions } from "@/hooks/use-sessions";
import { useDisclosure } from "@/hooks/use-disclosure";
import { LogsSkeleton } from "@/components/ui/skeletons";
import { SessionsTable } from "@/components/features/logs/sessions-table";
import { LiveLogsPanel } from "@/components/features/logs/live-logs-panel";
import { ScrapeControls } from "@/components/features/logs/scrape-controls";
import { SessionDetailDialog } from "@/components/features/logs/session-detail-dialog";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import type { ScrapeSession } from "@/types";

export default function Logs() {
  const { isScraping, isPaused, sessionId, liveLogs, connected } = useScrapeStore();
  const { triggerScrape } = useScrape();
  const { data: sessions = [], isLoading } = useSessions();

  const sessionDetailDialog = useDisclosure<ScrapeSession>();

  const liveStats = useMemo(() => {
    const success = liveLogs.filter((e) => e.level === "success").length;
    const error = liveLogs.filter((e) => e.level === "error" && e.account_username !== null).length;
    const deleted = liveLogs.filter(
      (e) => e.level === "warn" && e.message.includes("deleted"),
    ).length;
    const startLog = liveLogs.find((e) => e.message.startsWith("Starting scrape of"));
    const totalAccounts = Number(startLog?.message.match(/Starting scrape of (\d+)/)?.[1] ?? 0);
    return { success, error, deleted, totalAccounts };
  }, [liveLogs]);

  const prevIsScraping = useMemo(() => ({ current: false }), []);
  useEffect(() => {
    const wasOff = !prevIsScraping.current;
    prevIsScraping.current = isScraping;
    if (!isScraping && !wasOff) {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    }
  }, [isScraping, prevIsScraping]);

  const displaySessions = useMemo(() => {
    const liveRow: ScrapeSession | null =
      isScraping && sessionId
        ? {
            id: sessionId,
            started_at:
              sessions.find((s) => s.id === sessionId)?.started_at ?? new Date().toISOString(),
            finished_at: null,
            total_accounts: liveStats.totalAccounts,
            success_count: liveStats.success,
            error_count: liveStats.error,
            deleted_count: liveStats.deleted,
            status: isPaused ? "running" : "running",
          }
        : null;

    if (!liveRow) return sessions;
    const exists = sessions.some((s) => s.id === sessionId);
    return exists
      ? sessions.map((s) => (s.id === sessionId ? liveRow : s))
      : [liveRow, ...sessions];
  }, [sessions, isScraping, isPaused, sessionId, liveStats]);

  const controls = (
    <ScrapeControls isPaused={isPaused} isScraping={isScraping} onTrigger={triggerScrape} />
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Scrape Logs</h2>
            {connected ? (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isScraping ? "bg-green-500 animate-pulse" : "bg-green-500",
                  )}
                />
                {isScraping ? "Live" : "Connected"}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                Disconnected
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Historical scrape runs and real-time activity
          </p>
        </div>
        {!isScraping && (
          <ScrapeControls
            isPaused={isPaused}
            isScraping={isScraping}
            onTrigger={triggerScrape}
          />
        )}
      </div>

      {isScraping && (
        <LiveLogsPanel
          liveLogs={liveLogs}
          isPaused={isPaused}
          sessionId={sessionId}
          controls={controls}
        />
      )}

      {isLoading ? (
        <LogsSkeleton />
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ScrollText className="size-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No scrape sessions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Trigger a scrape to start logging</p>
          </div>
        </div>
      ) : (
        <SessionsTable sessions={displaySessions} onViewLogs={(s) => sessionDetailDialog.open(s)} />
      )}

      <SessionDetailDialog
        open={sessionDetailDialog.isOpen}
        onOpenChange={sessionDetailDialog.onOpenChange}
        session={sessionDetailDialog.data ?? null}
      />
    </div>
  );
}
