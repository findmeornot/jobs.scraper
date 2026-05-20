import { useState, useEffect, useRef, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Play, Loader2, ScrollText, CheckCircle2, XCircle, AlertTriangle, Info, Clock } from "lucide-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useScrapeStatus, type LiveLogEntry } from "@/hooks/use-scrape-status";
import { useScrape } from "@/hooks/use-scrape";
import { cn } from "@/lib/utils";

dayjs.extend(duration);

interface ScrapeSession {
  id: string;
  started_at: string;
  finished_at: string | null;
  total_accounts: number;
  success_count: number;
  error_count: number;
  deleted_count: number;
  status: "running" | "completed" | "failed";
}

function getDurationLabel(session: ScrapeSession): string {
  if (!session.finished_at) return "Running…";
  const ms = dayjs(session.finished_at).diff(dayjs(session.started_at));
  const d = dayjs.duration(ms);
  if (d.asSeconds() < 60) return `${Math.round(d.asSeconds())}s`;
  return `${Math.floor(d.asMinutes())}m ${d.seconds()}s`;
}

const LOG_LEVEL_ICON: Record<LiveLogEntry["level"], React.ReactNode> = {
  info:    <Info className="size-3 text-blue-500 shrink-0" />,
  warn:    <AlertTriangle className="size-3 text-yellow-500 shrink-0" />,
  error:   <XCircle className="size-3 text-destructive shrink-0" />,
  success: <CheckCircle2 className="size-3 text-green-500 shrink-0" />,
};

const LOG_LEVEL_CLASS: Record<LiveLogEntry["level"], string> = {
  info:    "text-foreground",
  warn:    "text-yellow-600 dark:text-yellow-400",
  error:   "text-destructive",
  success: "text-green-600 dark:text-green-400",
};

function LogLine({ entry }: { entry: LiveLogEntry }) {
  return (
    <div className={cn("flex items-start gap-2 py-1.5 px-3 text-xs font-mono border-b border-border/50 last:border-0", LOG_LEVEL_CLASS[entry.level])}>
      <span className="text-muted-foreground/50 shrink-0 tabular-nums mt-px">
        {dayjs(entry.created_at).format("HH:mm:ss")}
      </span>
      {LOG_LEVEL_ICON[entry.level]}
      {entry.account_username && (
        <span className="text-muted-foreground shrink-0">@{entry.account_username}</span>
      )}
      <span className="flex-1 break-words">{entry.message}</span>
      {entry.posts_count != null && entry.posts_count > 0 && (
        <span className="text-muted-foreground shrink-0">{entry.posts_count}p</span>
      )}
    </div>
  );
}

export default function Logs() {
  const { isScraping, sessionId, liveLogs, connected } = useScrapeStatus();
  const { triggerScrape } = useScrape();

  const [sessions, setSessions] = useState<ScrapeSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [selectedSession, setSelectedSession] = useState<ScrapeSession | null>(null);
  const [sessionLogs, setSessionLogs] = useState<LiveLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  const liveScrollRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const r = await fetch("/api/scrape/sessions");
      const data = await r.json();
      setSessions(data.results ?? []);
    } catch {} finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Refresh sessions list when a scrape ends
  useEffect(() => {
    if (!isScraping) fetchSessions();
  }, [isScraping, fetchSessions]);

  // Auto-scroll live log panel
  useEffect(() => {
    const el = liveScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [liveLogs]);

  async function openSessionLogs(session: ScrapeSession) {
    setSelectedSession(session);
    setLogsOpen(true);
    setLoadingLogs(true);
    try {
      const r = await fetch(`/api/scrape/sessions/${session.id}/logs`);
      const data = await r.json();
      setSessionLogs(data.logs ?? []);
    } catch {} finally {
      setLoadingLogs(false);
    }
  }

  const columns: ColumnDef<ScrapeSession>[] = [
    {
      accessorKey: "started_at",
      header: "Started",
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums">
          {dayjs(row.getValue("started_at")).format("DD MMM · HH:mm")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const s = row.getValue<ScrapeSession["status"]>("status");
        return (
          <Badge variant={s === "completed" ? "default" : s === "running" ? "secondary" : "destructive"}>
            {s === "running" && <Loader2 className="size-3 animate-spin mr-1" />}
            {s}
          </Badge>
        );
      },
    },
    {
      accessorKey: "total_accounts",
      header: "Accounts",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">{row.getValue<number>("total_accounts")}</span>
      ),
    },
    {
      accessorKey: "success_count",
      header: "Success",
      cell: ({ row }) => (
        <Badge variant="outline" className="tabular-nums text-green-600 border-green-200 dark:border-green-900">
          {row.getValue<number>("success_count")}
        </Badge>
      ),
    },
    {
      accessorKey: "error_count",
      header: "Errors",
      cell: ({ row }) => {
        const n = row.getValue<number>("error_count");
        return n > 0
          ? <Badge variant="destructive" className="tabular-nums">{n}</Badge>
          : <span className="text-muted-foreground/40 tabular-nums">0</span>;
      },
    },
    {
      accessorKey: "deleted_count",
      header: "Deleted",
      cell: ({ row }) => {
        const n = row.getValue<number>("deleted_count");
        return n > 0
          ? <Badge variant="outline" className="tabular-nums text-orange-600 border-orange-200">{n}</Badge>
          : <span className="text-muted-foreground/40 tabular-nums">0</span>;
      },
    },
    {
      id: "duration",
      header: "Duration",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
          <Clock className="size-3" />
          {getDurationLabel(row.original)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => null,
      enableSorting: false,
      size: 80,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => openSessionLogs(row.original)}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ScrollText className="size-3" />
          Logs
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Scrape Logs</h2>
            {connected ? (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <span className={cn("size-1.5 rounded-full", isScraping ? "bg-green-500 animate-pulse" : "bg-green-500")} />
                {isScraping ? "Live" : "Connected"}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                Disconnected
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Historical scrape runs and real-time activity</p>
        </div>
        <Button size="sm" onClick={triggerScrape} disabled={isScraping}>
          {isScraping ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {isScraping ? "Scraping…" : "Trigger Scrape"}
        </Button>
      </div>

      {/* Live log panel */}
      {isScraping && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium">Live — Session {sessionId?.slice(0, 8)}…</span>
            </div>
            <span className="text-xs text-muted-foreground">{liveLogs.length} entries</span>
          </div>
          <div
            ref={liveScrollRef}
            className="max-h-72 overflow-y-auto bg-card"
          >
            {liveLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Waiting for logs…</div>
            ) : (
              liveLogs.map((entry, i) => <LogLine key={entry.id || i} entry={entry} />)
            )}
          </div>
        </div>
      )}

      {/* Sessions table */}
      {loadingSessions ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
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
        <DataTable
          columns={columns}
          data={sessions}
          pageSize={18}
        />
      )}

      {/* Session logs dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden" style={{ maxHeight: "85vh" }}>
          <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ScrollText className="size-4" />
                Session Logs
              </DialogTitle>
            </DialogHeader>
            {selectedSession && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {dayjs(selectedSession.started_at).format("DD MMM YYYY · HH:mm:ss")}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {selectedSession.success_count} ok
                </Badge>
                {selectedSession.error_count > 0 && (
                  <Badge variant="destructive">{selectedSession.error_count} errors</Badge>
                )}
                {selectedSession.deleted_count > 0 && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    {selectedSession.deleted_count} deleted
                  </Badge>
                )}
                <Badge variant="secondary">{getDurationLabel(selectedSession)}</Badge>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 bg-card">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessionLogs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No logs found</div>
            ) : (
              sessionLogs.map((entry, i) => <LogLine key={entry.id || i} entry={entry} />)
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
