import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/toast";

export interface Account {
  id: number;
  username: string;
  instagram_id: string | null;
  followers: number;
  following: number;
  is_external: boolean;
  is_active: boolean;
  is_manual_input: boolean;
  created_at: string;
}

type FilterType = "all" | "external" | "internal";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    setLoading(true);
    const query =
      filter === "all" ? "" : `?type=${filter === "external" ? "true" : "false"}`;
    fetch(`/api/instagram/profile${query}`)
      .then((r) => r.json())
      .then((d) => setAccounts(d.results ?? []))
      .catch(() => toast.error("Failed to load accounts"))
      .finally(() => setLoading(false));
  }, [filter, tick]);

  async function addAccount(username: string, isExternal: boolean): Promise<boolean> {
    setSubmitting(true);
    try {
      const res = await fetch("/api/instagram/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username.trim()] }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Account added", `@${username} has been added.`);
      refetch();
      return true;
    } catch {
      toast.error("Failed to add account", "Please check the username and try again.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    accounts,
    loading,
    submitting,
    filter,
    setFilter,
    addAccount,
    refetch,
  };
}
