import { PieChart, Pie, Cell, Tooltip as RechartTooltip, Legend as RechartLegend } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const chartConfig = {
  external: { label: "External", color: "var(--color-chart-1)" },
  internal: { label: "Internal", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

const card = "rounded-2xl border border-border bg-card p-5";

interface AccountDistributionChartProps {
  externalAccounts: number;
  internalAccounts: number;
  totalAccounts: number;
}

export function AccountDistributionChart({
  externalAccounts,
  internalAccounts,
  totalAccounts,
}: AccountDistributionChartProps) {
  const data = [
    { name: "external", value: externalAccounts, fill: "var(--color-chart-1)" },
    { name: "internal", value: internalAccounts, fill: "var(--color-chart-2)" },
  ].filter((d) => d.value > 0);

  return (
    <div className={cn(card, "col-span-7")}>
      <p className="text-sm font-semibold">Account Distribution</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {totalAccounts.toLocaleString()} total accounts registered
      </p>
      {totalAccounts === 0 ? (
        <EmptyChart />
      ) : (
        <ChartContainer config={chartConfig} className="aspect-auto h-52 w-full mt-3">
          <PieChart>
            <RechartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((e) => (
                <Cell key={e.name} fill={e.fill} />
              ))}
            </Pie>
            <RechartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-52 mt-3">
      <p className="text-xs text-muted-foreground/60">No data available</p>
    </div>
  );
}
