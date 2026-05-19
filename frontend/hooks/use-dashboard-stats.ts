import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/toast";

export interface DashboardStats {
  total_accounts: number;
  total_content: number;
  pending_content: number;
  confirmed_content: number;
  external_accounts: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/dashboard/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.json();
      })
      .then((d) => setStats(d.data))
      .catch(() => {
        const msg = "Failed to load dashboard stats";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [tick]);

  return { stats, loading, error, refetch };
}
