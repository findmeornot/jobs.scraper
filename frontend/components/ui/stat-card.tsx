import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ColorVariant = "blue" | "green" | "yellow" | "purple" | "default";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: ColorVariant;
}

const COLOR_MAP: Record<ColorVariant, string> = {
  blue: "bg-chart-1/15 text-chart-1",
  green: "bg-chart-2/15 text-chart-2",
  yellow: "bg-chart-4/15 text-chart-4",
  purple: "bg-chart-5/15 text-chart-5",
  default: "bg-muted text-muted-foreground",
};

export default function StatCard({ label, value, icon: Icon, color = "default" }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div
          className={cn("flex h-8 w-8 items-center justify-center rounded-md", COLOR_MAP[color])}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
