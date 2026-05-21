import { useRef, useEffect } from "react";
import { Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import type { LiveLogEntry } from "@/types";

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

interface LiveLogsPanelProps {
  liveLogs: LiveLogEntry[];
  isPaused: boolean;
  sessionId: string | null;
  controls: React.ReactNode;
}

export function LiveLogsPanel({ liveLogs, isPaused, sessionId, controls }: LiveLogsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [liveLogs]);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", isPaused ? "bg-yellow-400" : "bg-green-500 animate-pulse")} />
          <span className="text-xs font-medium">
            {isPaused ? "Paused" : "Live"} — Session {sessionId?.slice(0, 8)}…
          </span>
          <span className="text-xs text-muted-foreground">{liveLogs.length} entries</span>
        </div>
        <div className="flex items-center gap-1">{controls}</div>
      </div>
      <div ref={scrollRef} className="max-h-72 overflow-y-auto bg-card">
        {liveLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Waiting for logs…</div>
        ) : (
          liveLogs.map((entry, i) => <LogLine key={entry.id || i} entry={entry} />)
        )}
      </div>
    </div>
  );
}

export { LogLine };
