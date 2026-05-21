import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, Cell } from "recharts";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const chartConfig = {
  value: { label: "Accounts", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

const card = "rounded-2xl border border-border bg-card p-5";

interface ContentBarChartProps {
  totalAccounts: number;
  externalAccounts: number;
  internalAccounts: number;
}

export function ContentBarChart({ totalAccounts, externalAccounts, internalAccounts }: ContentBarChartProps) {
  const data = [
    { label: "Total", value: totalAccounts, fill: "var(--color-chart-1)" },
    { label: "External", value: externalAccounts, fill: "var(--color-chart-5)" },
    { label: "Internal", value: internalAccounts, fill: "var(--color-chart-2)" },
  ];

  return (
    <div className={cn(card, "col-span-7")}>
      <p className="text-sm font-semibold">Account Breakdown</p>
      <p className="text-xs text-muted-foreground mt-0.5">Total vs type comparison</p>
      <ChartContainer config={chartConfig} className="aspect-auto h-44 w-full mt-3">
        <BarChart data={data} barSize={32} margin={{ left: -10, right: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} allowDecimals={false} />
          <RechartTooltip content={<ChartTooltipContent hideLabel />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((e) => <Cell key={e.label} fill={e.fill} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
