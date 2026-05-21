import { PieChart, Pie, Cell, Tooltip as RechartTooltip, Legend as RechartLegend } from "recharts";
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const chartConfig = {
  confirmed: { label: "Confirmed", color: "var(--color-chart-2)" },
  pending: { label: "Pending", color: "var(--color-chart-4)" },
  other: { label: "Other", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

const card = "rounded-2xl border border-border bg-card p-5";

interface ContentStatusChartProps {
  confirmed: number;
  pending: number;
  other: number;
  totalContent: number;
}

export function ContentStatusChart({ confirmed, pending, other, totalContent }: ContentStatusChartProps) {
  const data = [
    { name: "confirmed", value: confirmed, fill: "var(--color-chart-2)" },
    { name: "pending", value: pending, fill: "var(--color-chart-4)" },
    { name: "other", value: other, fill: "var(--color-chart-3)" },
  ].filter((d) => d.value > 0);

  return (
    <div className={cn(card, "col-span-5")}>
      <p className="text-sm font-semibold">Content Status</p>
      <p className="text-xs text-muted-foreground mt-0.5">{totalContent.toLocaleString()} total pieces</p>
      {totalContent === 0 ? (
        <div className="flex items-center justify-center h-44 mt-3">
          <p className="text-xs text-muted-foreground/60">No data available</p>
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="aspect-auto h-44 w-full mt-3">
          <PieChart>
            <RechartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>
              {data.map((e) => <Cell key={e.name} fill={e.fill} />)}
            </Pie>
            <RechartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      )}
    </div>
  );
}
