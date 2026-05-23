import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import type { DashboardStats } from "@/types";

async function fetchStats(date?: string): Promise<DashboardStats> {
  const params = date ? `?date=${date}` : "";
  const data = await apiFetch<{ data: DashboardStats }>(`/api/dashboard/stats${params}`);
  return data.data;
}

export function useDashboardStats(date?: string) {
  return useQuery({
    queryKey: ["dashboard-stats", date ?? "all"],
    queryFn: () => fetchStats(date),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    meta: { onError: () => toast.error("Failed to load dashboard stats") },
  });
}
