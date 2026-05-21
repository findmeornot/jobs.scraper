import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import type { DashboardStats } from "@/types";

async function fetchStats(): Promise<DashboardStats> {
  const data = await apiFetch<{ data: DashboardStats }>("/api/dashboard/stats");
  return data.data;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
    meta: { onError: () => toast.error("Failed to load dashboard stats") },
  });
}
