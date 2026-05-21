import { useState } from "react";
import { Loader2, ScrollText } from "lucide-react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogLine } from "./live-logs-panel";
import { getDurationLabel } from "./sessions-table";
import { apiFetch } from "@/lib/api";
import type { ScrapeSession, LiveLogEntry } from "@/types";

interface SessionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ScrapeSession | null;
}

export function SessionDetailDialog({ open, onOpenChange, session }: SessionDetailDialogProps) {
  const [logs, setLogs] = useState<LiveLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadLogs() {
    if (!session) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ logs: LiveLogEntry[] }>(
        `/api/scrape/sessions/${session.id}/logs`,
      );
      setLogs(data.logs ?? []);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(o: boolean) {
    if (o) loadLogs();
    else setLogs([]);
    onOpenChange(o);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="size-4" />
              Session Logs
            </DialogTitle>
          </DialogHeader>
          {session && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {dayjs(session.started_at).format("DD MMM YYYY · HH:mm:ss")}
              </span>
              <span className="text-muted-foreground/30">·</span>
              <Badge variant="outline" className="text-green-600 border-green-200">
                {session.success_count} ok
              </Badge>
              {session.error_count > 0 && (
                <Badge variant="destructive">{session.error_count} errors</Badge>
              )}
              {session.deleted_count > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  {session.deleted_count} deleted
                </Badge>
              )}
              <Badge variant="secondary">{getDurationLabel(session)}</Badge>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 bg-card">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No logs found</div>
          ) : (
            logs.map((entry, i) => <LogLine key={entry.id || i} entry={entry} />)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
