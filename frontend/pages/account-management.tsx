import { useState, useMemo } from "react";
import { Plus, Loader2, Users, RefreshCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountManagementSkeleton } from "@/components/ui/skeletons";
import {
  useAccounts,
  useAccountRegions,
  useAddAccount,
  useEditAccount,
  useDeleteAccount,
  useSyncAccountId,
  useSyncAllIds,
  useAddRegionToAccount,
  useRemoveRegionFromAccount,
} from "@/hooks/use-accounts";
import { useRegionData } from "@/hooks/use-regions";
import { useConfirm } from "@/hooks/use-confirm";
import { useScrapeStore } from "@/stores/scrape.store";
import { useDisclosure } from "@/hooks/use-disclosure";
import {
  AccountsTable,
  AccountRegionsDialog,
  RegionSelectorDialog,
} from "@/components/features/accounts/accounts-table";
import {
  AddAccountDialog,
  EditAccountDialog,
} from "@/components/features/accounts/account-form-dialog";
import type { Account, SyncProgress } from "@/types";
import type { AccountFormData, EditAccountFormData } from "@/schemas/account.schema";

type FilterType = "all" | "external" | "internal";

export default function AccountManagement() {
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: accounts = [], isLoading } = useAccounts(filter);
  const { data: regionData } = useRegionData();
  const syncProgress = useScrapeStore((s) => s.syncProgress);

  const addAccount = useAddAccount();
  const editAccount = useEditAccount();
  const deleteAccount = useDeleteAccount();
  const syncId = useSyncAccountId();
  const syncAll = useSyncAllIds();
  const addRegion = useAddRegionToAccount();
  const removeRegion = useRemoveRegionFromAccount();
  const confirm = useConfirm();

  const addDialog = useDisclosure();
  const editDialog = useDisclosure<Account>();
  const regionsDialog = useDisclosure<Account>();
  const selectorDialog = useDisclosure();
  const [syncingRows, setSyncingRows] = useState<Set<string>>(new Set());

  const { data: accountRegions = [], isLoading: loadingRegions } = useAccountRegions(
    regionsDialog.isOpen ? (regionsDialog.data?.id ?? null) : null,
  );

  const assignedRegionIds = useMemo(
    () => new Set(accountRegions.map((r) => r.region_id)),
    [accountRegions],
  );
  const unassignedRegions = useMemo(
    () => (regionData?.regions ?? []).filter((r) => !assignedRegionIds.has(r.id)),
    [regionData?.regions, assignedRegionIds],
  );

  async function handleSyncAll() {
    const ok = await confirm({
      title: "Sync all Instagram IDs?",
      description:
        "All accounts will be re-synced. Accounts that cannot be resolved will be permanently deleted.",
      confirmLabel: "Sync & Delete unresolvable",
      variant: "destructive",
    });
    if (ok) syncAll.mutate();
  }

  async function handleSyncRow(username: string) {
    setSyncingRows((prev) => new Set(prev).add(username));
    await syncId.mutateAsync(username).catch(() => {});
    setSyncingRows((prev) => {
      const n = new Set(prev);
      n.delete(username);
      return n;
    });
  }

  async function handleAdd(data: AccountFormData): Promise<boolean> {
    await addAccount.mutateAsync(data);
    return true;
  }

  async function handleEdit(data: EditAccountFormData): Promise<boolean> {
    if (!editDialog.data) return false;
    await editAccount.mutateAsync({ id: editDialog.data.id, data });
    return true;
  }

  async function handleDelete(account: Account) {
    const ok = await confirm({
      title: "Delete account?",
      description: `@${account.username} will be permanently removed along with all region assignments.`,
      variant: "destructive",
      confirmLabel: "Delete",
    });
    if (ok) await deleteAccount.mutateAsync(account.id);
  }

  async function handleBulkAddRegions(regionIds: number[]) {
    if (!regionsDialog.data) return;
    for (const id of regionIds) {
      await addRegion.mutateAsync({ regionId: id, accountId: regionsDialog.data.id });
    }
  }

  async function handleRemoveRegion(regionId: number, accountId: number, regionName: string) {
    const ok = await confirm({
      title: "Remove from region?",
      description: `This account will be unassigned from "${regionName}".`,
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (ok) await removeRegion.mutateAsync({ regionId, accountId });
  }

  if (isLoading) return <AccountManagementSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Accounts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage Instagram accounts for scraping
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={syncAll.isPending}>
              {syncProgress.running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {syncProgress.total > 0
                    ? `${syncProgress.processed}/${syncProgress.total}`
                    : "Starting…"}
                </>
              ) : (
                <>
                  <RefreshCcw className="size-4" />
                  Sync All IDs
                </>
              )}
            </Button>
            <Button onClick={() => addDialog.open()} size="sm">
              <Plus className="size-4" />
              Add Account
            </Button>
          </div>
          <SyncStatusBadge syncProgress={syncProgress} />
        </div>
      </div>

      {accounts.length === 0 && filter === "all" ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No accounts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first Instagram account to start scraping
            </p>
          </div>
          <Button size="sm" onClick={() => addDialog.open()}>
            <Plus className="size-4" />
            Add Account
          </Button>
        </div>
      ) : (
        <AccountsTable
          accounts={accounts}
          filter={filter}
          onFilterChange={setFilter}
          syncingRows={syncingRows}
          onSyncRow={handleSyncRow}
          onEdit={(account) => editDialog.open(account)}
          onDelete={handleDelete}
          onManageRegions={(account) => regionsDialog.open(account)}
        />
      )}

      <AddAccountDialog
        open={addDialog.isOpen}
        onOpenChange={addDialog.onOpenChange}
        onSubmit={handleAdd}
        isPending={addAccount.isPending}
      />

      <EditAccountDialog
        open={editDialog.isOpen}
        onOpenChange={editDialog.onOpenChange}
        account={editDialog.data ?? null}
        onSubmit={handleEdit}
        isPending={editAccount.isPending}
      />

      <AccountRegionsDialog
        open={regionsDialog.isOpen}
        onOpenChange={regionsDialog.onOpenChange}
        account={regionsDialog.data ?? null}
        accountRegions={accountRegions}
        loadingRegions={loadingRegions}
        unassignedRegions={unassignedRegions}
        onOpenSelector={selectorDialog.open}
        onRemoveRegion={handleRemoveRegion}
      />

      <RegionSelectorDialog
        open={selectorDialog.isOpen}
        onOpenChange={selectorDialog.onOpenChange}
        available={unassignedRegions}
        onAdd={handleBulkAddRegions}
        title="Assign to Regions"
        description={`Select regions to assign @${regionsDialog.data?.username ?? ""} to`}
      />
    </div>
  );
}

function SyncStatusBadge({ syncProgress }: { syncProgress: SyncProgress }) {
  if (syncProgress.total === 0) return null;

  if (syncProgress.running) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Loader2 className="size-3 animate-spin" />
        {syncProgress.current
          ? `Syncing @${syncProgress.current}`
          : "Preparing…"}
      </p>
    );
  }

  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
      <CheckCircle2 className="size-3 text-green-500" />
      Last sync: {syncProgress.processed}/{syncProgress.total} resolved
      {syncProgress.failed > 0 && `, ${syncProgress.failed} deleted`}
    </p>
  );
}
