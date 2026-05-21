import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pause, Loader2, Clock, ScrollText } from "lucide-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { ScrapeSession } from "@/types";

dayjs.extend(duration);

export function getDurationLabel(session: ScrapeSession): string {
  if (!session.finished_at) return "Running…";
  const ms = dayjs(session.finished_at).diff(dayjs(session.started_at));
  const d = dayjs.duration(ms);
  if (d.asSeconds() < 60) return `${Math.round(d.asSeconds())}s`;
  return `${Math.floor(d.asMinutes())}m ${d.seconds()}s`;
}

interface SessionsTableProps {
  sessions: ScrapeSession[];
  onViewLogs: (session: ScrapeSession) => void;
}

export function SessionsTable({ sessions, onViewLogs }: SessionsTableProps) {
  const columns: ColumnDef<ScrapeSession>[] = useMemo(() => [
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
        const s = row.getValue<string>("status");
        return (
          <Badge variant={
            s === "completed" ? "default" :
            s === "running" ? "secondary" :
            s === "paused" ? "outline" : "destructive"
          }>
            {s === "running" && <Loader2 className="size-3 animate-spin mr-1" />}
            {s === "paused" && <Pause className="size-3 mr-1 text-yellow-500" />}
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
          variant="ghost" size="xs"
          onClick={() => onViewLogs(row.original)}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ScrollText className="size-3" />
          Logs
        </Button>
      ),
    },
  ], [onViewLogs]);

  return <DataTable columns={columns} data={sessions} pageSize={18} />;
}
