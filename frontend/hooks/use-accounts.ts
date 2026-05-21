import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { useScrapeStore } from "@/stores/scrape.store";
import type { Account, AccountRegion, AccountFilterType, SyncMode, ImportResult } from "@/types";
import type { AccountFormData, EditAccountFormData } from "@/schemas/account.schema";

async function fetchAccounts(filter: AccountFilterType): Promise<Account[]> {
  const query = filter === "all" ? "" : `?type=${filter === "external" ? "true" : "false"}`;
  const data = await apiFetch<{ results: Account[] }>(`/api/instagram/profile${query}`);
  return data.results ?? [];
}

async function fetchAccountRegions(accountId: number): Promise<AccountRegion[]> {
  const data = await apiFetch<{ results: AccountRegion[] }>(
    `/api/instagram/profile/${accountId}/regions`,
  );
  return data.results ?? [];
}

export function useAccounts(filter: AccountFilterType = "all") {
  return useQuery({
    queryKey: ["accounts", filter],
    queryFn: () => fetchAccounts(filter),
  });
}

export function useAccountRegions(accountId: number | null) {
  return useQuery({
    queryKey: ["account-regions", accountId],
    queryFn: () => fetchAccountRegions(accountId!),
    enabled: accountId !== null,
  });
}

export function useAddAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AccountFormData) =>
      apiFetch("/api/instagram/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [data.username] }),
      }),
    onSuccess: () => {
      toast.success("Account added");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: () => toast.error("Failed to add account"),
  });
}

export function useEditAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditAccountFormData }) =>
      apiFetch(`/api/instagram/profile/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Account updated");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: () => toast.error("Failed to update account"),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/instagram/profile/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Account deleted");
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: () => toast.error("Failed to delete account"),
  });
}

export function useSyncAccountId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const data = await apiFetch<{
        results: Array<{ success: boolean; userId?: string; error?: string }>;
      }>("/api/instagram/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] }),
      });
      const result = data.results?.[0];
      if (!result?.success) throw new Error(result?.error ?? "Unknown error");
      return { username, userId: result.userId };
    },
    onSuccess: ({ username, userId }) => {
      toast.success("ID synced", `@${username} → ${userId}`);
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (_err, username) =>
      toast.error("Sync failed", `Could not resolve ID for @${username}`),
  });
}

export function useSyncAccounts() {
  const qc = useQueryClient();
  const syncProgress = useScrapeStore((s) => s.syncProgress);
  const prevRunning = useRef(false);

  useEffect(() => {
    const wasRunning = prevRunning.current;
    prevRunning.current = syncProgress.running;

    if (!wasRunning || syncProgress.running) return;

    qc.invalidateQueries({ queryKey: ["accounts"] });

    if (syncProgress.canResume) {
      toast.info("Sync paused", `${syncProgress.pendingCount} accounts remaining`);
    } else if (syncProgress.total === 0) {
      toast.info("Nothing to sync", "All accounts already have Instagram IDs.");
    } else {
      toast.success(
        "Sync complete",
        `${syncProgress.processed}/${syncProgress.total} resolved, ${syncProgress.failed} deleted`,
      );
    }
  }, [syncProgress, qc]);

  const mutation = useMutation({
    mutationFn: (options: { mode: SyncMode; resume?: boolean }) =>
      apiFetch("/api/instagram/profile/sync-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      }),
    onSuccess: (_data, options) => {
      const label = options.resume ? "Sync resumed" : "Sync started";
      const desc = options.mode === "empty" ? "Syncing accounts with missing IDs…" : "Syncing all accounts…";
      toast.info(label, desc);
    },
    onError: () => toast.error("Sync failed", "Could not start sync."),
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending || syncProgress.running,
  };
}

export function useImportAccounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: Array<{ username: string; type: "external" | "internal" }>) =>
      apiFetch<{ data: ImportResult }>("/api/instagram/profile/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      }).then((res) => res.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
    onError: () => toast.error("Import failed", "Could not import accounts."),
  });
}

export function useStopSync() {
  return useMutation({
    mutationFn: () => apiFetch("/api/instagram/profile/sync-ids/stop", { method: "POST" }),
    onError: () => toast.error("Stop failed", "Could not stop sync."),
  });
}

export function useAddRegionToAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ regionId, accountId }: { regionId: number; accountId: number }) =>
      apiFetch(`/api/master/region/${regionId}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: accountId }),
      }),
    onSuccess: (_data, { accountId }) => {
      toast.success("Added to region");
      qc.invalidateQueries({ queryKey: ["account-regions", accountId] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: () => toast.error("Failed to add to region"),
  });
}

export function useRemoveRegionFromAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ regionId, accountId }: { regionId: number; accountId: number }) =>
      apiFetch(`/api/master/region/${regionId}/accounts/${accountId}`, { method: "DELETE" }),
    onSuccess: (_data, { accountId }) => {
      toast.success("Removed from region");
      qc.invalidateQueries({ queryKey: ["account-regions", accountId] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: () => toast.error("Failed to remove from region"),
  });
}
