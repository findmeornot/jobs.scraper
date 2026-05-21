import { useState, useMemo } from "react";
import { Plus, Loader2, Users, MapPin } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AccountSelector } from "@/components/ui/account-selector";
import { RegionManagementSkeleton } from "@/components/ui/skeletons";
import { useRegionData, useRegionAccounts, useSaveRegion, useDeleteRegion, useSaveProvince, useDeleteProvince, useSaveGroup, useDeleteGroup, useAddAccountToRegion, useRemoveAccountFromRegion, useUpdateRegionGroup } from "@/hooks/use-regions";
import { useAccounts } from "@/hooks/use-accounts";
import { useConfirm } from "@/hooks/use-confirm";
import { useDisclosure } from "@/hooks/use-disclosure";
import { RegionsTab } from "@/components/features/regions/regions-tab";
import { ProvincesTab } from "@/components/features/regions/provinces-tab";
import { GroupsTab } from "@/components/features/regions/groups-tab";
import { RegionDialog, ProvinceDialog, GroupDialog } from "@/components/features/regions/region-form-dialog";
import { cn } from "@/lib/utils";
import type { Region, Province, Group } from "@/types";
import type { RegionFormData, ProvinceFormData, GroupFormData } from "@/schemas/region.schema";

type ActivePanel = "regions" | "provinces" | "groups";

const TABS: { id: ActivePanel; label: string }[] = [
  { id: "regions", label: "Regions" },
  { id: "provinces", label: "Provinces" },
  { id: "groups", label: "Groups" },
];

export default function RegionManagement() {
  const { data, isLoading } = useRegionData();
  const regions = data?.regions ?? [];
  const provinces = data?.provinces ?? [];
  const groups = data?.groups ?? [];

  const { data: allAccounts = [] } = useAccounts();
  const confirm = useConfirm();

  const saveRegion = useSaveRegion();
  const deleteRegion = useDeleteRegion();
  const saveProvince = useSaveProvince();
  const deleteProvince = useDeleteProvince();
  const saveGroup = useSaveGroup();
  const deleteGroup = useDeleteGroup();
  const addAccount = useAddAccountToRegion();
  const removeAccount = useRemoveAccountFromRegion();
  const updateGroup = useUpdateRegionGroup();

  const [activePanel, setActivePanel] = useState<ActivePanel>("regions");

  const accountsDialog = useDisclosure<Region>();
  const accountSelectorDialog = useDisclosure();
  const regionFormDialog = useDisclosure<Region>();
  const provinceFormDialog = useDisclosure<Province>();
  const groupFormDialog = useDisclosure<Group>();
  const groupDetailDialog = useDisclosure<Group>();

  const { data: regionAccounts = [], isLoading: loadingAccounts } = useRegionAccounts(
    accountsDialog.isOpen ? accountsDialog.data?.id ?? null : null,
  );

  const assignedIds = useMemo(
    () => new Set(regionAccounts.map((ra) => ra.account_id)),
    [regionAccounts],
  );
  const unassignedAccounts = useMemo(
    () => allAccounts.filter((a) => !assignedIds.has(a.id)),
    [allAccounts, assignedIds],
  );
  const groupRegions = useMemo(
    () => groupDetailDialog.data ? regions.filter((r) => r.group_id === groupDetailDialog.data!.id) : [],
    [regions, groupDetailDialog.data],
  );

  async function handleSaveRegion(data: RegionFormData, editingId?: number): Promise<boolean> {
    await saveRegion.mutateAsync({ data, editingId });
    return true;
  }

  async function handleDeleteRegion(region: Region) {
    const ok = await confirm({ title: "Delete region?", description: `"${region.name}" and all account assignments will be removed.`, variant: "destructive", confirmLabel: "Delete" });
    if (ok) await deleteRegion.mutateAsync(region.id);
  }

  async function handleSaveProvince(data: ProvinceFormData, editingId?: number): Promise<boolean> {
    await saveProvince.mutateAsync({ data, editingId });
    return true;
  }

  async function handleDeleteProvince(p: Province) {
    const ok = await confirm({ title: "Delete province?", description: `"${p.name}" will be permanently deleted.`, variant: "destructive", confirmLabel: "Delete" });
    if (ok) await deleteProvince.mutateAsync(p.id);
  }

  async function handleSaveGroup(data: GroupFormData, editingId?: number): Promise<boolean> {
    await saveGroup.mutateAsync({ data, editingId });
    return true;
  }

  async function handleDeleteGroup(g: Group) {
    const ok = await confirm({ title: "Delete group?", description: `"${g.name}" will be permanently deleted.`, variant: "destructive", confirmLabel: "Delete" });
    if (ok) await deleteGroup.mutateAsync(g.id);
  }

  async function handleBulkAddAccounts(accountIds: number[]) {
    if (!accountsDialog.data) return;
    for (const id of accountIds) {
      await addAccount.mutateAsync({ regionId: accountsDialog.data.id, accountId: id });
    }
  }

  async function handleRemoveAccount(regionId: number, accountId: number, username: string) {
    const ok = await confirm({ title: "Remove account?", description: `@${username} will be unassigned from this region.`, confirmLabel: "Remove", variant: "destructive" });
    if (ok) await removeAccount.mutateAsync({ regionId, accountId });
  }

  async function handleRemoveRegionFromGroup(region: Region) {
    const ok = await confirm({ title: "Remove from group?", description: `"${region.name}" will be unassigned from this group.`, variant: "destructive", confirmLabel: "Remove" });
    if (ok) await updateGroup.mutateAsync({ regionId: region.id, groupId: null, regions });
  }

  const addButtons: Record<ActivePanel, React.ReactNode> = {
    regions: <Button size="sm" onClick={() => regionFormDialog.open()}><Plus className="size-4" />Add Region</Button>,
    provinces: <Button size="sm" onClick={() => provinceFormDialog.open()}><Plus className="size-4" />Add Province</Button>,
    groups: <Button size="sm" onClick={() => groupFormDialog.open()}><Plus className="size-4" />Add Group</Button>,
  };

  const tabChips = (
    <div className="flex gap-1.5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActivePanel(tab.id)}
          className={cn(
            "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border shrink-0",
            activePanel === tab.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  if (isLoading) return <RegionManagementSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Region Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage regions, provinces, and content groups</p>
        </div>
        {addButtons[activePanel]}
      </div>

      {activePanel === "regions" && (
        <RegionsTab
          regions={regions}
          tabChips={tabChips}
          onEdit={(r) => regionFormDialog.open(r)}
          onDelete={handleDeleteRegion}
          onManageAccounts={(r) => accountsDialog.open(r)}
        />
      )}
      {activePanel === "provinces" && (
        <ProvincesTab
          provinces={provinces}
          tabChips={tabChips}
          onEdit={(p) => provinceFormDialog.open(p)}
          onDelete={handleDeleteProvince}
        />
      )}
      {activePanel === "groups" && (
        <GroupsTab
          groups={groups}
          regions={regions}
          tabChips={tabChips}
          onEdit={(g) => groupFormDialog.open(g)}
          onDelete={handleDeleteGroup}
          onViewDetails={(g) => groupDetailDialog.open(g)}
        />
      )}

      {/* Region Accounts Dialog */}
      <Dialog open={accountsDialog.isOpen} onOpenChange={accountsDialog.onOpenChange}>
        <DialogContent className="sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden" style={{ maxHeight: "85vh" }}>
          <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <h2 className="text-base font-semibold leading-none">{accountsDialog.data?.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {accountsDialog.data?.province_name}{accountsDialog.data?.group_name ? ` · ${accountsDialog.data.group_name}` : ""} ·{" "}
              <strong className="text-foreground font-medium">{accountsDialog.data?.account_count ?? 0} accounts</strong>
            </p>
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={accountSelectorDialog.open} disabled={unassignedAccounts.length === 0}>
                <Plus className="size-4" />
                {unassignedAccounts.length === 0 ? "All accounts assigned" : "Assign Accounts"}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {loadingAccounts ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
            ) : regionAccounts.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2 text-center px-6">
                <Users className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No accounts assigned</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Username</TableHead><TableHead>Instagram ID</TableHead><TableHead>Status</TableHead><TableHead /></TableRow>
                </TableHeader>
                <TableBody>
                  {regionAccounts.map((ra) => (
                    <TableRow key={ra.id}>
                      <TableCell className="font-medium">@{ra.username}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{ra.instagram_id ?? "—"}</TableCell>
                      <TableCell><Badge variant={ra.is_active ? "default" : "outline"}>{ra.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="xs" onClick={() => handleRemoveAccount(accountsDialog.data!.id, ra.account_id, ra.username)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AccountSelector
        open={accountSelectorDialog.isOpen}
        onOpenChange={accountSelectorDialog.onOpenChange}
        available={unassignedAccounts}
        onAdd={handleBulkAddAccounts}
        title="Assign Accounts"
        description={`Select accounts to assign to ${accountsDialog.data?.name ?? "this region"}`}
      />

      {/* Group Detail Dialog */}
      <Dialog open={groupDetailDialog.isOpen} onOpenChange={groupDetailDialog.onOpenChange}>
        <DialogContent className="sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden" style={{ maxHeight: "85vh" }}>
          <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold leading-none">{groupDetailDialog.data?.name}</h2>
              <Badge variant={groupDetailDialog.data?.is_active ? "default" : "outline"}>
                {groupDetailDialog.data?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {groupRegions.length} region{groupRegions.length !== 1 ? "s" : ""} · {groupRegions.reduce((s, r) => s + r.account_count, 0)} total accounts
            </p>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {groupRegions.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2 text-center px-6">
                <MapPin className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No regions in this group</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Region</TableHead><TableHead>Province</TableHead><TableHead>Accounts</TableHead><TableHead /></TableRow>
                </TableHeader>
                <TableBody>
                  {groupRegions.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell className="font-medium">{region.name}</TableCell>
                      <TableCell className="text-muted-foreground">{region.province_name}</TableCell>
                      <TableCell><Badge variant="secondary" className="tabular-nums">{region.account_count}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="xs" onClick={() => { groupDetailDialog.close(); accountsDialog.open(region); }} className="gap-1">
                            <Users className="size-3" />Accounts
                          </Button>
                          <Button variant="ghost" size="xs" onClick={() => handleRemoveRegionFromGroup(region)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">Remove</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RegionDialog
        open={regionFormDialog.isOpen}
        onOpenChange={regionFormDialog.onOpenChange}
        editing={regionFormDialog.data}
        provinces={provinces}
        groups={groups}
        onSubmit={handleSaveRegion}
        isPending={saveRegion.isPending}
      />

      <ProvinceDialog
        open={provinceFormDialog.isOpen}
        onOpenChange={provinceFormDialog.onOpenChange}
        editing={provinceFormDialog.data}
        onSubmit={handleSaveProvince}
        isPending={saveProvince.isPending}
      />

      <GroupDialog
        open={groupFormDialog.isOpen}
        onOpenChange={groupFormDialog.onOpenChange}
        editing={groupFormDialog.data}
        onSubmit={handleSaveGroup}
        isPending={saveGroup.isPending}
      />
    </div>
  );
}
