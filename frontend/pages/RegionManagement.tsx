import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  MapPin,
  Layers,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Autocomplete } from "@/components/ui/autocomplete";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountSelector } from "@/components/ui/account-selector";
import { useRegions } from "@/hooks/use-regions";
import { useAccounts } from "@/hooks/use-accounts";
import type {
  Region,
  Province,
  Group,
  RegionAccount,
  RegionFormData,
  ProvinceFormData,
  GroupFormData,
} from "@/hooks/use-regions";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";

type ActivePanel = "regions" | "provinces" | "groups";

const TABS: { id: ActivePanel; label: string }[] = [
  { id: "regions", label: "Regions" },
  { id: "provinces", label: "Provinces" },
  { id: "groups", label: "Groups" },
];

export default function RegionManagement() {
  const {
    regions, provinces, groups, loading,
    selectedRegion, selectRegion, regionAccounts, loadingAccounts,
    addAccountToRegion, removeAccountFromRegion, updateRegionGroup,
    saveRegion, deleteRegion, saveProvince, deleteProvince, saveGroup, deleteGroup,
  } = useRegions();

  const { accounts: allAccounts } = useAccounts();
  const confirm = useConfirm();

  const [activePanel, setActivePanel] = useState<ActivePanel>("regions");
  const [accountsDialogOpen, setAccountsDialogOpen] = useState(false);
  const [accountSelectorOpen, setAccountSelectorOpen] = useState(false);

  const [regionModal, setRegionModal] = useState<{ open: boolean; editing?: Region }>({ open: false });
  const [regionForm, setRegionForm] = useState<Partial<RegionFormData>>({});

  const [provinceModal, setProvinceModal] = useState<{ open: boolean; editing?: Province }>({ open: false });
  const [provinceForm, setProvinceForm] = useState<Partial<ProvinceFormData>>({});

  const [groupModal, setGroupModal] = useState<{ open: boolean; editing?: Group }>({ open: false });
  const [groupForm, setGroupForm] = useState<Partial<GroupFormData>>({});

  const [groupDetail, setGroupDetail] = useState<{ open: boolean; group?: Group }>({ open: false });

  const assignedIds = useMemo(
    () => new Set(regionAccounts.map((ra) => ra.account_id)),
    [regionAccounts],
  );
  const unassignedAccounts = useMemo(
    () => allAccounts.filter((a) => !assignedIds.has(a.id)),
    [allAccounts, assignedIds],
  );
  const groupRegions = useMemo(
    () => groupDetail.group ? regions.filter((r) => r.group_id === groupDetail.group!.id) : [],
    [regions, groupDetail.group],
  );

  function openAccountsDialog(region: Region) {
    selectRegion(region);
    setAccountsDialogOpen(true);
  }

  async function handleBulkAddAccounts(accountIds: number[]) {
    if (!selectedRegion) return;
    for (const id of accountIds) await addAccountToRegion(selectedRegion.id, id);
  }

  async function handleSaveRegion() {
    if (!regionForm.name || !regionForm.province_id) return;
    const ok = await saveRegion(regionForm as RegionFormData, regionModal.editing?.id);
    if (ok) setRegionModal({ open: false });
  }

  async function handleDeleteRegion(region: Region) {
    const ok = await confirm({ title: "Delete region?", description: `"${region.name}" and all account assignments will be removed.`, variant: "destructive", confirmLabel: "Delete" });
    if (ok) await deleteRegion(region.id);
  }

  async function handleSaveProvince() {
    if (!provinceForm.name) return;
    const ok = await saveProvince(provinceForm as ProvinceFormData, provinceModal.editing?.id);
    if (ok) setProvinceModal({ open: false });
  }

  async function handleDeleteProvince(p: Province) {
    const ok = await confirm({ title: "Delete province?", description: `"${p.name}" will be permanently deleted.`, variant: "destructive", confirmLabel: "Delete" });
    if (ok) await deleteProvince(p.id);
  }

  async function handleSaveGroup() {
    if (!groupForm.name) return;
    const ok = await saveGroup(groupForm as GroupFormData, groupModal.editing?.id);
    if (ok) setGroupModal({ open: false });
  }

  async function handleDeleteGroup(g: Group) {
    const ok = await confirm({ title: "Delete group?", description: `"${g.name}" will be permanently deleted.`, variant: "destructive", confirmLabel: "Delete" });
    if (ok) await deleteGroup(g.id);
  }

  async function handleRemoveRegionFromGroup(region: Region) {
    const ok = await confirm({ title: "Remove from group?", description: `"${region.name}" will be unassigned from this group.`, variant: "destructive", confirmLabel: "Remove" });
    if (ok) await updateRegionGroup(region.id, null);
  }

  async function handleRemoveAccountFromRegion(regionId: number, accountId: number, username: string) {
    const ok = await confirm({
      title: "Remove account?",
      description: `@${username} will be unassigned from this region.`,
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (ok) await removeAccountFromRegion(regionId, accountId);
  }

  // --- Column definitions ---

  const regionColumns: ColumnDef<Region>[] = useMemo(() => [
    {
      accessorKey: "name", header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "province_name", header: "Province",
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("province_name")}</span>,
    },
    {
      accessorKey: "group_name", header: "Group", enableSorting: false,
      cell: ({ row }) => {
        const name = row.getValue<string | null>("group_name");
        return name ? <Badge variant="secondary">{name}</Badge> : <span className="text-muted-foreground/40">—</span>;
      },
    },
    {
      accessorKey: "account_count", header: "Accounts",
      cell: ({ row }) => {
        const n = row.getValue<number>("account_count");
        return <Badge variant={n > 0 ? "outline" : "ghost"} className="tabular-nums">{n}</Badge>;
      },
    },
    {
      id: "actions", header: () => null, enableSorting: false, size: 160,
      cell: ({ row }) => {
        const region = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="xs" onClick={() => openAccountsDialog(region)} className="gap-1">
              <Users className="size-3" />Accounts
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => { setRegionForm({ name: region.name, province_id: region.province_id, group_id: region.group_id, js_loker: region.js_loker }); setRegionModal({ open: true, editing: region }); }} aria-label={`Edit ${region.name}`}>
              <Pencil className="size-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => handleDeleteRegion(region)} className="hover:text-destructive hover:bg-destructive/10" aria-label={`Delete ${region.name}`}>
              <Trash2 className="size-3" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  const provinceColumns: ColumnDef<Province>[] = useMemo(() => [
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span> },
    {
      accessorKey: "is_active", header: "Status", enableSorting: false,
      cell: ({ row }) => { const a = row.getValue<boolean>("is_active"); return <Badge variant={a ? "default" : "outline"}>{a ? "Active" : "Inactive"}</Badge>; },
    },
    {
      id: "actions", header: () => null, enableSorting: false, size: 80,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => { setProvinceForm({ name: p.name, is_active: p.is_active ? 1 : 0 }); setProvinceModal({ open: true, editing: p }); }} aria-label={`Edit ${p.name}`}>
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteProvince(p)} className="hover:text-destructive hover:bg-destructive/10" aria-label={`Delete ${p.name}`}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  const groupColumns: ColumnDef<Group>[] = useMemo(() => [
    { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span> },
    {
      accessorKey: "is_active", header: "Status", enableSorting: false,
      cell: ({ row }) => { const a = row.getValue<boolean>("is_active"); return <Badge variant={a ? "default" : "outline"}>{a ? "Active" : "Inactive"}</Badge>; },
    },
    {
      id: "region_count", header: "Regions", enableSorting: false,
      cell: ({ row }) => {
        const count = regions.filter((r) => r.group_id === row.original.id).length;
        return <Badge variant={count > 0 ? "secondary" : "ghost"} className="tabular-nums">{count}</Badge>;
      },
    },
    {
      id: "actions", header: () => null, enableSorting: false, size: 120,
      cell: ({ row }) => {
        const g = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="xs" onClick={() => setGroupDetail({ open: true, group: g })} className="gap-1">
              <FolderOpen className="size-3" />Details
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => { setGroupForm({ name: g.name, is_active: g.is_active ? 1 : 0 }); setGroupModal({ open: true, editing: g }); }} aria-label={`Edit ${g.name}`}>
              <Pencil className="size-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => handleDeleteGroup(g)} className="hover:text-destructive hover:bg-destructive/10" aria-label={`Delete ${g.name}`}>
              <Trash2 className="size-3" />
            </Button>
          </div>
        );
      },
    },
  ], [regions]);

  const addButtons: Record<ActivePanel, React.ReactNode> = {
    regions: <Button size="sm" onClick={() => { setRegionForm({}); setRegionModal({ open: true }); }}><Plus className="size-4" />Add Region</Button>,
    provinces: <Button size="sm" onClick={() => { setProvinceForm({}); setProvinceModal({ open: true }); }}><Plus className="size-4" />Add Province</Button>,
    groups: <Button size="sm" onClick={() => { setGroupForm({}); setGroupModal({ open: true }); }}><Plus className="size-4" />Add Group</Button>,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Region Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage regions, provinces, and content groups</p>
        </div>
        {!loading && addButtons[activePanel]}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
      ) : (
        <>
          {activePanel === "regions" && (
            regions.length === 0
              ? <>
                  <TabChips activePanel={activePanel} setActivePanel={setActivePanel} />
                  <EmptyState icon={MapPin} title="No regions yet" description="Create your first region" />
                </>
              : <DataTable columns={regionColumns} data={regions} searchColumn="name" searchPlaceholder="Search regions..."
                  toolbarLeft={<TabChips activePanel={activePanel} setActivePanel={setActivePanel} />} />
          )}
          {activePanel === "provinces" && (
            provinces.length === 0
              ? <>
                  <TabChips activePanel={activePanel} setActivePanel={setActivePanel} />
                  <EmptyState icon={MapPin} title="No provinces yet" description="Add provinces to organize regions" />
                </>
              : <DataTable columns={provinceColumns} data={provinces} searchColumn="name" searchPlaceholder="Search provinces..."
                  toolbarLeft={<TabChips activePanel={activePanel} setActivePanel={setActivePanel} />} />
          )}
          {activePanel === "groups" && (
            groups.length === 0
              ? <>
                  <TabChips activePanel={activePanel} setActivePanel={setActivePanel} />
                  <EmptyState icon={Layers} title="No groups yet" description="Create groups to categorize content" />
                </>
              : <DataTable columns={groupColumns} data={groups} searchColumn="name" searchPlaceholder="Search groups..."
                  toolbarLeft={<TabChips activePanel={activePanel} setActivePanel={setActivePanel} />} />
          )}
        </>
      )}

      {/* ── Region Accounts Dialog ── */}
      <Dialog open={accountsDialogOpen} onOpenChange={setAccountsDialogOpen}>
        <DialogContent className="sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden" style={{ maxHeight: "85vh" }}>
          <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold leading-none">{selectedRegion?.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRegion?.province_name}{selectedRegion?.group_name ? ` · ${selectedRegion.group_name}` : ""} · <strong className="text-foreground font-medium">{selectedRegion?.account_count ?? 0} accounts</strong>
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={() => setAccountSelectorOpen(true)} disabled={unassignedAccounts.length === 0}>
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
                <p className="text-xs text-muted-foreground/60">Click "Assign Accounts" to add accounts to this region</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Username</TableHead><TableHead>Instagram ID</TableHead><TableHead>Status</TableHead><TableHead /></TableRow>
                </TableHeader>
                <TableBody>
                  {regionAccounts.map((ra: RegionAccount) => (
                    <TableRow key={ra.id}>
                      <TableCell className="font-medium">@{ra.username}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{ra.instagram_id ?? "—"}</TableCell>
                      <TableCell><Badge variant={ra.is_active ? "default" : "outline"}>{ra.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="xs" onClick={() => handleRemoveAccountFromRegion(selectedRegion!.id, ra.account_id, ra.username)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AccountSelector open={accountSelectorOpen} onOpenChange={setAccountSelectorOpen} available={unassignedAccounts} onAdd={handleBulkAddAccounts} title="Assign Accounts" description={`Select accounts to assign to ${selectedRegion?.name ?? "this region"}`} />

      {/* ── Group Detail Dialog ── */}
      <Dialog open={groupDetail.open} onOpenChange={(o) => setGroupDetail((s) => ({ ...s, open: o }))}>
        <DialogContent className="sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden" style={{ maxHeight: "85vh" }}>
          <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold leading-none">{groupDetail.group?.name}</h2>
              <Badge variant={groupDetail.group?.is_active ? "default" : "outline"}>
                {groupDetail.group?.is_active ? "Active" : "Inactive"}
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
                <p className="text-xs text-muted-foreground/60">Edit a region and assign it to this group</p>
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
                          <Button variant="ghost" size="xs" onClick={() => { setGroupDetail((s) => ({ ...s, open: false })); openAccountsDialog(region); }} className="gap-1">
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
          <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => { setGroupDetail((s) => ({ ...s, open: false })); if (groupDetail.group) { setGroupForm({ name: groupDetail.group.name, is_active: groupDetail.group.is_active ? 1 : 0 }); setGroupModal({ open: true, editing: groupDetail.group }); } }}>
              <Pencil className="size-3.5" />Edit Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Region Add/Edit Dialog ── */}
      <Dialog open={regionModal.open} onOpenChange={(o) => setRegionModal((s) => ({ ...s, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{regionModal.editing ? "Edit Region" : "Add Region"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Region Name</label>
              <Input autoFocus value={regionForm.name ?? ""} onChange={(e) => setRegionForm((f) => ({ ...f, name: e.target.value }))} placeholder="Enter region name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Province</label>
              <Autocomplete
                searchPlaceholder="Search provinces..."
                placeholder="Select province..."
                value={regionForm.province_id ? String(regionForm.province_id) : null}
                onValueChange={(v) => setRegionForm((f) => ({ ...f, province_id: v ? Number(v) : undefined }))}
                items={provinces.map((p) => ({ value: String(p.id), label: p.name }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Group <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Autocomplete
                searchPlaceholder="Search groups..."
                placeholder="No group"
                value={regionForm.group_id ? String(regionForm.group_id) : null}
                onValueChange={(v) => setRegionForm((f) => ({ ...f, group_id: v ? Number(v) : null }))}
                items={groups.map((g) => ({ value: String(g.id), label: g.name }))}
                clearable
                clearLabel="No group"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                JS Loker ID <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Input type="number" value={String(regionForm.js_loker ?? "")} onChange={(e) => setRegionForm((f) => ({ ...f, js_loker: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 123" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegionModal({ open: false })}>Cancel</Button>
            <Button onClick={handleSaveRegion} disabled={!regionForm.name || !regionForm.province_id}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Province Dialog ── */}
      <Dialog open={provinceModal.open} onOpenChange={(o) => setProvinceModal((s) => ({ ...s, open: o }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{provinceModal.editing ? "Edit Province" : "Add Province"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Province Name</label>
              <Input autoFocus value={provinceForm.name ?? ""} onChange={(e) => setProvinceForm((f) => ({ ...f, name: e.target.value }))} placeholder="Enter province name" />
            </div>
            {provinceModal.editing && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Status</label>
                <StatusToggle
                  value={provinceForm.is_active ?? 1}
                  onChange={(v) => setProvinceForm((f) => ({ ...f, is_active: v }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProvinceModal({ open: false })}>Cancel</Button>
            <Button onClick={handleSaveProvince} disabled={!provinceForm.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Group Dialog ── */}
      <Dialog open={groupModal.open} onOpenChange={(o) => setGroupModal((s) => ({ ...s, open: o }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{groupModal.editing ? "Edit Group" : "Add Group"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Group Name</label>
              <Input autoFocus value={groupForm.name ?? ""} onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))} placeholder="Enter group name" />
            </div>
            {groupModal.editing && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Status</label>
                <StatusToggle
                  value={groupForm.is_active ?? 1}
                  onChange={(v) => setGroupForm((f) => ({ ...f, is_active: v }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupModal({ open: false })}>Cancel</Button>
            <Button onClick={handleSaveGroup} disabled={!groupForm.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabChips({
  activePanel,
  setActivePanel,
}: {
  activePanel: ActivePanel;
  setActivePanel: (p: ActivePanel) => void;
}) {
  return (
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
}


const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
] as const;

function StatusToggle({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
            value === opt.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      {action}
    </div>
  );
}
