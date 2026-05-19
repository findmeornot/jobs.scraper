import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
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
import { useRegions } from "@/hooks/use-regions";
import type {
  Region,
  Province,
  Group,
  RegionAccount,
  RegionFormData,
  ProvinceFormData,
  GroupFormData,
} from "@/hooks/use-regions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type ActivePanel = "regions" | "provinces" | "groups";

const TABS: { id: ActivePanel; label: string }[] = [
  { id: "regions", label: "Regions" },
  { id: "provinces", label: "Provinces" },
  { id: "groups", label: "Groups" },
];

export default function RegionManagement() {
  const {
    regions,
    provinces,
    groups,
    loading,
    regionAccounts,
    loadingAccounts,
    selectRegion,
    saveRegion,
    deleteRegion,
    saveProvince,
    saveGroup,
    removeAccountFromRegion,
  } = useRegions();

  const confirm = useConfirm();
  const [activePanel, setActivePanel] = useState<ActivePanel>("regions");

  // Region dialog state
  const [regionModal, setRegionModal] = useState<{
    open: boolean;
    editing?: Region;
  }>({ open: false });
  const [regionForm, setRegionForm] = useState<Partial<RegionFormData>>({});

  // Province dialog state
  const [provinceModal, setProvinceModal] = useState<{
    open: boolean;
    editing?: Province;
  }>({ open: false });
  const [provinceForm, setProvinceForm] = useState<Partial<ProvinceFormData>>({});

  // Group dialog state
  const [groupModal, setGroupModal] = useState<{
    open: boolean;
    editing?: Group;
  }>({ open: false });
  const [groupForm, setGroupForm] = useState<Partial<GroupFormData>>({});

  // Region accounts dialog state
  const [accountsModal, setAccountsModal] = useState<{
    open: boolean;
    region?: Region;
  }>({ open: false });

  function openAccountsForRegion(region: Region) {
    setAccountsModal({ open: true, region });
    selectRegion(region);
  }

  async function handleSaveRegion() {
    if (!regionForm.name || !regionForm.province_id) return;
    const ok = await saveRegion(regionForm as RegionFormData, regionModal.editing?.id);
    if (ok) setRegionModal({ open: false });
  }

  async function handleDeleteRegion(region: Region) {
    const ok = await confirm({
      title: "Delete region?",
      description: `"${region.name}" will be permanently deleted.`,
      variant: "destructive",
      confirmLabel: "Delete",
    });
    if (ok) await deleteRegion(region.id);
  }

  async function handleSaveProvince() {
    if (!provinceForm.name) return;
    const ok = await saveProvince(provinceForm as ProvinceFormData, provinceModal.editing?.id);
    if (ok) setProvinceModal({ open: false });
  }

  async function handleSaveGroup() {
    if (!groupForm.name) return;
    const ok = await saveGroup(groupForm as GroupFormData, groupModal.editing?.id);
    if (ok) setGroupModal({ open: false });
  }

  // --- Column definitions ---

  const regionColumns: ColumnDef<Region>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "province_name",
        header: "Province",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.getValue("province_name")}</span>
        ),
      },
      {
        accessorKey: "group_name",
        header: "Group",
        cell: ({ row }) => {
          const name = row.getValue<string | null>("group_name");
          return name ? (
            <span className="text-muted-foreground">{name}</span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          );
        },
      },
      {
        accessorKey: "account_count",
        header: "Accounts",
        cell: ({ row }) => {
          const count = row.getValue<number>("account_count");
          return (
            <Badge variant="secondary" className="tabular-nums">
              {count}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        size: 140,
        cell: ({ row }) => {
          const region = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => openAccountsForRegion(region)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Users className="size-3" />
                Accounts
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setRegionForm({
                    name: region.name,
                    province_id: region.province_id,
                    group_id: region.group_id,
                    js_loker: region.js_loker,
                  });
                  setRegionModal({ open: true, editing: region });
                }}
                aria-label={`Edit ${region.name}`}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDeleteRegion(region)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${region.name}`}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          );
        },
      },
    ],
    [provinces, groups],
  );

  const provinceColumns: ColumnDef<Province>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const active = row.getValue<boolean>("is_active");
          return (
            <Badge variant={active ? "default" : "outline"}>
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        size: 60,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setProvinceForm({ name: p.name, is_active: p.is_active ? 1 : 0 });
                setProvinceModal({ open: true, editing: p });
              }}
              aria-label={`Edit ${p.name}`}
            >
              <Pencil className="size-3.5" />
            </Button>
          );
        },
      },
    ],
    [],
  );

  const groupColumns: ColumnDef<Group>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const active = row.getValue<boolean>("is_active");
          return (
            <Badge variant={active ? "default" : "outline"}>
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        size: 60,
        cell: ({ row }) => {
          const g = row.original;
          return (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setGroupForm({ name: g.name, is_active: g.is_active ? 1 : 0 });
                setGroupModal({ open: true, editing: g });
              }}
              aria-label={`Edit ${g.name}`}
            >
              <Pencil className="size-3.5" />
            </Button>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Region Management
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage provinces, groups, and regions
        </p>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activePanel === tab.id
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <>
          {activePanel === "regions" && (
            <DataTable
              columns={regionColumns}
              data={regions}
              searchColumn="name"
              searchPlaceholder="Search regions..."
              toolbarRight={
                <Button
                  size="sm"
                  onClick={() => {
                    setRegionForm({});
                    setRegionModal({ open: true });
                  }}
                >
                  <Plus className="size-4" />
                  Add Region
                </Button>
              }
            />
          )}

          {activePanel === "provinces" && (
            <DataTable
              columns={provinceColumns}
              data={provinces}
              searchColumn="name"
              searchPlaceholder="Search provinces..."
              toolbarRight={
                <Button
                  size="sm"
                  onClick={() => {
                    setProvinceForm({});
                    setProvinceModal({ open: true });
                  }}
                >
                  <Plus className="size-4" />
                  Add Province
                </Button>
              }
            />
          )}

          {activePanel === "groups" && (
            <DataTable
              columns={groupColumns}
              data={groups}
              searchColumn="name"
              searchPlaceholder="Search groups..."
              toolbarRight={
                <Button
                  size="sm"
                  onClick={() => {
                    setGroupForm({});
                    setGroupModal({ open: true });
                  }}
                >
                  <Plus className="size-4" />
                  Add Group
                </Button>
              }
            />
          )}
        </>
      )}

      {/* Region Accounts Dialog */}
      <Dialog
        open={accountsModal.open}
        onOpenChange={(open) => setAccountsModal((s) => ({ ...s, open }))}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{accountsModal.region?.name}</DialogTitle>
            <DialogDescription>Assigned accounts</DialogDescription>
          </DialogHeader>
          <DialogBody className="p-0">
            {loadingAccounts ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : regionAccounts.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No accounts assigned to this region
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Instagram ID</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regionAccounts.map((ra: RegionAccount) => (
                    <TableRow key={ra.id}>
                      <TableCell className="font-medium">
                        @{ra.username}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {ra.instagram_id ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => removeAccountFromRegion(ra.account_id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Region Add/Edit Dialog */}
      <Dialog
        open={regionModal.open}
        onOpenChange={(open) => setRegionModal((s) => ({ ...s, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {regionModal.editing ? "Edit Region" : "Add Region"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Region Name
              </label>
              <Input
                value={regionForm.name ?? ""}
                onChange={(e) =>
                  setRegionForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Enter region name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Province
              </label>
              <Select
                value={regionForm.province_id ? String(regionForm.province_id) : ""}
                onValueChange={(v) =>
                  setRegionForm((f) => ({ ...f, province_id: Number(v) }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select province..." />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Group{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Select
                value={regionForm.group_id ? String(regionForm.group_id) : "__none__"}
                onValueChange={(v) =>
                  setRegionForm((f) => ({
                    ...f,
                    group_id: v === "__none__" ? null : Number(v),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No group</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                JS Loker ID{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                type="number"
                value={String(regionForm.js_loker ?? "")}
                onChange={(e) =>
                  setRegionForm((f) => ({
                    ...f,
                    js_loker: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                placeholder="e.g. 123"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegionModal({ open: false })}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRegion}
              disabled={!regionForm.name || !regionForm.province_id}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Province Add/Edit Dialog */}
      <Dialog
        open={provinceModal.open}
        onOpenChange={(open) => setProvinceModal((s) => ({ ...s, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {provinceModal.editing ? "Edit Province" : "Add Province"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Province Name
              </label>
              <Input
                value={provinceForm.name ?? ""}
                onChange={(e) =>
                  setProvinceForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Enter province name"
              />
            </div>
            {provinceModal.editing && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Status
                </label>
                <Select
                  value={String(provinceForm.is_active ?? 1)}
                  onValueChange={(v) =>
                    setProvinceForm((f) => ({ ...f, is_active: Number(v) }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProvinceModal({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSaveProvince} disabled={!provinceForm.name}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Add/Edit Dialog */}
      <Dialog
        open={groupModal.open}
        onOpenChange={(open) => setGroupModal((s) => ({ ...s, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {groupModal.editing ? "Edit Group" : "Add Group"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Group Name
              </label>
              <Input
                value={groupForm.name ?? ""}
                onChange={(e) =>
                  setGroupForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Enter group name"
              />
            </div>
            {groupModal.editing && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Status
                </label>
                <Select
                  value={String(groupForm.is_active ?? 1)}
                  onValueChange={(v) =>
                    setGroupForm((f) => ({ ...f, is_active: Number(v) }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupModal({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={!groupForm.name}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
