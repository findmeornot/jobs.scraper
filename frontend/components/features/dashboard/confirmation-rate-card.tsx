import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const card = "rounded-2xl border border-border bg-card p-5";

interface ConfirmationRateCardProps {
  confirmRate: number;
  confirmed: number;
  totalContent: number;
  externalAccounts: number;
  internalAccounts: number;
  pending: number;
}

export function ConfirmationRateCard({
  confirmRate,
  confirmed,
  totalContent,
  externalAccounts,
  internalAccounts,
  pending,
}: ConfirmationRateCardProps) {
  const breakdown = [
    { label: "External accounts", value: externalAccounts, color: "bg-chart-1" },
    { label: "Internal accounts", value: internalAccounts, color: "bg-chart-2" },
    { label: "Pending content", value: pending, color: "bg-chart-4" },
    { label: "Confirmed content", value: confirmed, color: "bg-chart-2" },
  ];

  return (
    <div className="col-span-5 flex flex-col gap-3">
      <div className={cn(card, "flex-1")}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold">Confirmation Rate</p>
            <p className="text-xs text-muted-foreground mt-0.5">Content approved out of total</p>
          </div>
          <TrendingUp className="size-4 text-muted-foreground shrink-0" />
        </div>
        <div className="mt-4">
          <div className="text-4xl font-bold tabular-nums">
            {confirmRate}
            <span className="text-2xl text-muted-foreground">%</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-chart-2 transition-all duration-700"
              style={{ width: `${confirmRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{confirmed.toLocaleString()} confirmed</span>
            <span>{totalContent.toLocaleString()} total</span>
          </div>
        </div>
      </div>

      <div className={cn(card, "flex-1")}>
        <p className="text-sm font-semibold mb-3">Breakdown</p>
        <div className="space-y-2.5">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("size-2 rounded-full shrink-0", item.color)} />
                <span className="text-xs text-muted-foreground truncate">{item.label}</span>
              </div>
              <span className="text-sm font-medium tabular-nums shrink-0">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
