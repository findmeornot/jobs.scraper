import { Users, Globe, Hourglass, CheckCircle2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  className?: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

function StatTile({ className, label, value, icon: Icon, accent }: StatTileProps) {
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

interface StatsSummaryProps {
  totalAccounts: number;
  externalAccounts: number;
  totalContent: number;
  pending: number;
  confirmed: number;
}

export function StatsSummary({ totalAccounts, externalAccounts, totalContent, pending, confirmed }: StatsSummaryProps) {
  return (
    <>
      <StatTile className="col-span-3" label="Total Accounts" value={totalAccounts} icon={Users} accent="bg-chart-1/15 text-chart-1" />
      <StatTile className="col-span-2" label="External" value={externalAccounts} icon={Globe} accent="bg-chart-5/15 text-chart-5" />
      <StatTile className="col-span-2" label="Total Content" value={totalContent} icon={Activity} accent="bg-muted text-muted-foreground" />
      <StatTile className="col-span-2" label="Pending" value={pending} icon={Hourglass} accent="bg-chart-4/15 text-chart-4" />
      <StatTile className="col-span-3" label="Confirmed" value={confirmed} icon={CheckCircle2} accent="bg-chart-2/15 text-chart-2" />
    </>
  );
}
