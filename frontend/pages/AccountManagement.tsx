import { useState, useRef, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Loader2, Users, RefreshCcw, Pencil, Trash2, MapPin, Check, Search } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccounts, type Account, type AccountRegion } from "@/hooks/use-accounts";
import { useRegions } from "@/hooks/use-regions";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "external", label: "External" },
  { value: "internal", label: "Internal" },
] as const;

const STATUS_OPTIONS = [
  { value: true, label: "Active" },
  { value: false, label: "Inactive" },
] as const;

const TYPE_OPTIONS = [
  { value: true, label: "External" },
  { value: false, label: "Internal" },
] as const;

export default function AccountManagement() {
  const {
    accounts, loading, submitting, filter, setFilter,
    syncAccountId, addAccount, editAccount, deleteAccount,
    accountRegions, loadingAccountRegions, fetchAccountRegions,
    addRegionToAccount, removeRegionFromAccount, refetch,
  } = useAccounts();

  const { regions } = useRegions();
  const confirm = useConfirm();

  const [addOpen, setAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newIsExternal, setNewIsExternal] = useState(true);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncingRows, setSyncingRows] = useState<Set<string>>(new Set());

  const [editModal, setEditModal] = useState<{ open: boolean; account?: Account }>({ open: false });
  const [editForm, setEditForm] = useState<{ username: string; is_external: boolean; is_active: boolean }>({ username: "", is_external: true, is_active: true });

  const [regionsOpen, setRegionsOpen] = useState(false);
  const [regionSelectorOpen, setRegionSelectorOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const assignedRegionIds = useMemo(
    () => new Set(accountRegions.map((r) => r.region_id)),
    [accountRegions],
  );
  const unassignedRegions = useMemo(
    () => regions.filter((r) => !assignedRegionIds.has(r.id)),
    [regions, assignedRegionIds],
  );

  async function handleSyncIds() {
    const ok = await confirm({
      title: "Sync all Instagram IDs?",
      description: "All accounts will be re-synced. Accounts that cannot be resolved will be permanently deleted.",
      confirmLabel: "Sync & Delete unresolvable",
      variant: "destructive",
    });
    if (!ok) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/instagram/profile/sync-ids", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Sync started", "All accounts are being re-synced. Unresolvable accounts will be deleted.");
      setTimeout(refetch, 8_000);
    } catch {
      toast.error("Sync failed", "Could not start ID sync. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSyncRow(username: string) {
    setSyncingRows((prev) => new Set(prev).add(username));
    await syncAccountId(username);
    setSyncingRows((prev) => {
      const next = new Set(prev);
      next.delete(username);
      return next;
    });
  }

  async function handleAdd() {
    const ok = await addAccount(newUsername, newIsExternal);
    if (ok) {
      setAddOpen(false);
      setNewUsername("");
      setNewIsExternal(true);
    }
  }

  function openEditModal(account: Account) {
    setEditForm({
      username: account.username,
      is_external: Boolean(account.is_external),
      is_active: Boolean(account.is_active),
    });
    setEditModal({ open: true, account });
  }

  async function handleEdit() {
    if (!editModal.account || !editForm.username.trim()) return;
    const ok = await editAccount(editModal.account.id, {
      username: editForm.username.trim(),
      is_external: editForm.is_external,
      is_active: editForm.is_active,
    });
    if (ok) setEditModal({ open: false });
  }

  async function handleDelete(account: Account) {
    const ok = await confirm({
      title: "Delete account?",
      description: `@${account.username} will be permanently removed along with all region assignments.`,
      variant: "destructive",
      confirmLabel: "Delete",
    });
    if (ok) await deleteAccount(account.id);
  }

  function openRegionsDialog(account: Account) {
    setSelectedAccount(account);
    fetchAccountRegions(account.id);
    setRegionsOpen(true);
  }

  async function handleBulkAddRegions(regionIds: number[]) {
    if (!selectedAccount) return;
    for (const id of regionIds) await addRegionToAccount(id, selectedAccount.id);
  }

  async function handleRemoveRegion(regionId: number, accountId: number, regionName: string) {
    const ok = await confirm({
      title: "Remove from region?",
      description: `This account will be unassigned from "${regionName}".`,
      confirmLabel: "Remove",
      variant: "destructive",
    });
    if (ok) await removeRegionFromAccount(regionId, accountId);
  }

  const columns = useMemo<ColumnDef<Account>[]>(
    () => [
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => (
          <span className="font-medium">@{row.getValue("username")}</span>
        ),
      },
      {
        accessorKey: "instagram_id",
        header: "Instagram ID",
        enableSorting: false,
        cell: ({ row }) => {
          const id = row.getValue<string | null>("instagram_id");
          return (
            <span className={cn("font-mono text-xs", id ? "text-muted-foreground" : "text-muted-foreground/40")}>
              {id ?? "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "followers",
        header: "Followers",
        cell: ({ row }) => {
          const val = row.getValue<number>("followers");
          return (
            <span className="tabular-nums text-muted-foreground">
              {val?.toLocaleString() ?? 0}
            </span>
          );
        },
      },
      {
        accessorKey: "is_external",
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => {
          const isExternal = row.getValue<boolean>("is_external");
          return (
            <Badge variant={isExternal ? "outline" : "secondary"}>
              {isExternal ? "External" : "Internal"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "is_active",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const isActive = row.getValue<boolean>("is_active");
          return (
            <Badge variant={isActive ? "default" : "outline"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "region_count",
        header: "Regions",
        cell: ({ row }) => {
          const n = row.getValue<number>("region_count");
          return (
            <Badge variant={n > 0 ? "outline" : "ghost"} className="tabular-nums">
              {n}
            </Badge>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Added",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {dayjs(row.getValue("created_at")).format("DD MMM YYYY")}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => null,
        enableSorting: false,
        size: 200,
        cell: ({ row }) => {
          const account = row.original;
          const isSyncing = syncingRows.has(account.username);
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => openRegionsDialog(account)}
                className="gap-1 text-muted-foreground hover:text-foreground"
                aria-label={`Manage regions for @${account.username}`}
              >
                <MapPin className="size-3" />Regions
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleSyncRow(account.username)}
                disabled={isSyncing}
                className="gap-1 text-muted-foreground hover:text-foreground"
                aria-label={`Sync Instagram ID for @${account.username}`}
              >
                {isSyncing ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCcw className="size-3" />
                )}
                Sync ID
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => openEditModal(account)}
                aria-label={`Edit @${account.username}`}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(account)}
                className="hover:text-destructive hover:bg-destructive/10"
                aria-label={`Delete @${account.username}`}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          );
        },
      },
    ],
    [syncingRows],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Accounts</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage Instagram accounts for scraping</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncIds}
            disabled={syncing}
            title="Sync Instagram IDs for all accounts missing one"
          >
            {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
            Sync All IDs
          </Button>
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus className="size-4" />
            Add Account
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : accounts.length === 0 && filter === "all" ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No accounts yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first Instagram account to start scraping</p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add Account
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={accounts}
          searchColumn="username"
          searchPlaceholder="Search username..."
          toolbarLeft={
            <div className="flex gap-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
                    filter === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          }
        />
      )}

      {/* ── Add Account Dialog ── */}
      <Dialog open={addOpen} onOpenChange={(open) => setAddOpen(open)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Instagram Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="new-username" className="text-xs font-medium text-foreground">
                Username
              </label>
              <Input
                id="new-username"
                ref={usernameInputRef}
                autoFocus
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. company_account"
                onKeyDown={(e) => { if (e.key === "Enter" && newUsername.trim()) handleAdd(); }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Type</label>
              <div className="flex gap-1.5">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setNewIsExternal(opt.value)}
                    className={cn(
                      "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
                      newIsExternal === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={submitting || !newUsername.trim()} aria-busy={submitting}>
              {submitting ? (
                <><Loader2 className="size-4 animate-spin" />Adding...</>
              ) : (
                "Add Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Account Dialog ── */}
      <Dialog open={editModal.open} onOpenChange={(o) => setEditModal((s) => ({ ...s, open: o }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {editModal.account && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Username</label>
                <Input
                  autoFocus
                  value={editForm.username}
                  onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter" && editForm.username.trim()) handleEdit(); }}
                  placeholder="username"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Type</label>
                <div className="flex gap-1.5">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, is_external: opt.value }))}
                      className={cn(
                        "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
                        editForm.is_external === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Status</label>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, is_active: opt.value }))}
                      className={cn(
                        "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
                        editForm.is_active === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal({ open: false })}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editForm.username.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Account Regions Dialog ── */}
      <Dialog open={regionsOpen} onOpenChange={setRegionsOpen}>
        <DialogContent className="sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden" style={{ maxHeight: "85vh" }}>
          <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold leading-none">@{selectedAccount?.username}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedAccount?.is_external ? "External" : "Internal"} ·{" "}
                  <strong className="text-foreground font-medium">{accountRegions.length} region{accountRegions.length !== 1 ? "s" : ""}</strong>
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRegionSelectorOpen(true)}
                disabled={unassignedRegions.length === 0}
              >
                <Plus className="size-4" />
                {unassignedRegions.length === 0 ? "All regions assigned" : "Assign to Region"}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {loadingAccountRegions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : accountRegions.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2 text-center px-6">
                <MapPin className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Not assigned to any region</p>
                <p className="text-xs text-muted-foreground/60">Click "Assign to Region" to add this account to regions</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountRegions.map((ar: AccountRegion) => (
                    <TableRow key={ar.id}>
                      <TableCell className="font-medium">{ar.region_name}</TableCell>
                      <TableCell className="text-muted-foreground">{ar.province_name ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleRemoveRegion(ar.region_id, ar.account_id, ar.region_name)}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Region Selector Dialog ── */}
      <RegionSelector
        open={regionSelectorOpen}
        onOpenChange={setRegionSelectorOpen}
        available={unassignedRegions}
        onAdd={handleBulkAddRegions}
        title="Assign to Regions"
        description={`Select regions to assign @${selectedAccount?.username ?? ""} to`}
      />
    </div>
  );
}

interface RegionItem {
  id: number;
  name: string;
  province_name: string;
  group_name: string | null;
}

interface RegionSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  available: RegionItem[];
  onAdd: (regionIds: number[]) => Promise<void>;
  title?: string;
  description?: string;
}

function RegionSelector({
  open,
  onOpenChange,
  available,
  onAdd,
  title = "Assign to Regions",
  description,
}: RegionSelectorProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? available.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.province_name.toLowerCase().includes(q) ||
            (r.group_name ?? "").toLowerCase().includes(q),
        )
      : available;
  }, [available, search]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (filtered.length > 0 && filtered.every((r) => selected.has(r.id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  }

  async function handleAdd() {
    if (selected.size === 0) return;
    setAdding(true);
    await onAdd([...selected]);
    setAdding(false);
    setSelected(new Set());
    setSearch("");
    onOpenChange(false);
  }

  function handleClose() {
    setSelected(new Set());
    setSearch("");
    onOpenChange(false);
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden" style={{ maxHeight: "85vh" }}>
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold leading-none">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search by region or province..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-2 border-b border-border shrink-0">
            <button
              onClick={toggleAll}
              className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <CheckboxIcon checked={allFilteredSelected} />
              Select all ({filtered.length})
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          {available.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <MapPin className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">All regions already assigned</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No regions match "{search}"
            </div>
          ) : (
            <div className="px-2 py-1.5 space-y-0.5">
              {filtered.map((region) => {
                const isSelected = selected.has(region.id);
                return (
                  <button
                    key={region.id}
                    onClick={() => toggle(region.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                      isSelected ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <CheckboxIcon checked={isSelected} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{region.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {region.province_name}
                        {region.group_name && <span className="ml-2">· {region.group_name}</span>}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <DialogFooter>
            <div className="flex items-center gap-2 mr-auto">
              {selected.size > 0 && (
                <Badge variant="secondary">{selected.size} selected</Badge>
              )}
            </div>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleAdd} disabled={selected.size === 0 || adding}>
              {adding ? (
                <><Loader2 className="size-4 animate-spin" />Adding...</>
              ) : (
                `Assign to ${selected.size > 0 ? selected.size : ""} Region${selected.size !== 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background",
      )}
      aria-hidden
    >
      {checked && <Check className="size-2.5 stroke-[3]" />}
    </span>
  );
}
