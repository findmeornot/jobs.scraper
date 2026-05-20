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
  region_count: number;
  created_at: string;
}

export interface AccountRegion {
  id: number;
  region_id: number;
  account_id: number;
  region_name: string;
  province_name: string | null;
}

type FilterType = "all" | "external" | "internal";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [tick, setTick] = useState(0);

  const [accountRegions, setAccountRegions] = useState<AccountRegion[]>([]);
  const [loadingAccountRegions, setLoadingAccountRegions] = useState(false);

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

  async function syncAccountId(username: string): Promise<boolean> {
    try {
      const res = await fetch("/api/instagram/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      const result = data.results?.[0];
      if (!result?.success) throw new Error(result?.error ?? "Unknown error");
      toast.success("ID synced", `@${username} → ${result.userId}`);
      refetch();
      return true;
    } catch {
      toast.error("Sync failed", `Could not resolve ID for @${username}`);
      return false;
    }
  }

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

  async function editAccount(id: number, data: { username?: string; is_external: boolean; is_active: boolean }): Promise<boolean> {
    try {
      const res = await fetch(`/api/instagram/profile/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Account updated");
      refetch();
      return true;
    } catch {
      toast.error("Failed to update account");
      return false;
    }
  }

  async function deleteAccount(id: number): Promise<boolean> {
    try {
      const res = await fetch(`/api/instagram/profile/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Account deleted");
      refetch();
      return true;
    } catch {
      toast.error("Failed to delete account");
      return false;
    }
  }

  async function fetchAccountRegions(accountId: number): Promise<void> {
    setLoadingAccountRegions(true);
    try {
      const res = await fetch(`/api/instagram/profile/${accountId}/regions`);
      const data = await res.json();
      setAccountRegions(data.results ?? []);
    } catch {
      toast.error("Failed to load account regions");
    } finally {
      setLoadingAccountRegions(false);
    }
  }

  async function addRegionToAccount(regionId: number, accountId: number): Promise<boolean> {
    try {
      const res = await fetch(`/api/master/region/${regionId}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: accountId }),
      });
      if (!res.ok) throw new Error();
      await fetchAccountRegions(accountId);
      setAccounts((prev) =>
        prev.map((a) => a.id === accountId ? { ...a, region_count: a.region_count + 1 } : a),
      );
      toast.success("Added to region");
      return true;
    } catch {
      toast.error("Failed to add to region");
      return false;
    }
  }

  async function removeRegionFromAccount(regionId: number, accountId: number): Promise<void> {
    try {
      await fetch(`/api/master/region/${regionId}/accounts/${accountId}`, { method: "DELETE" });
      setAccountRegions((prev) => prev.filter((r) => r.region_id !== regionId));
      setAccounts((prev) =>
        prev.map((a) => a.id === accountId ? { ...a, region_count: Math.max(0, a.region_count - 1) } : a),
      );
      toast.success("Removed from region");
    } catch {
      toast.error("Failed to remove from region");
    }
  }

  return {
    accounts,
    loading,
    submitting,
    filter,
    setFilter,
    syncAccountId,
    addAccount,
    editAccount,
    deleteAccount,
    accountRegions,
    loadingAccountRegions,
    fetchAccountRegions,
    addRegionToAccount,
    removeRegionFromAccount,
    refetch,
  };
}
