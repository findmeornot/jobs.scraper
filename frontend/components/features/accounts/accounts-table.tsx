import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, RefreshCcw, Pencil, Trash2, MapPin, Plus, Search, Check } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Account, AccountRegion, Region } from "@/types";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "external", label: "External" },
  { value: "internal", label: "Internal" },
] as const;

interface AccountsTableProps {
  accounts: Account[];
  filter: "all" | "external" | "internal";
  onFilterChange: (filter: "all" | "external" | "internal") => void;
  syncingRows: Set<string>;
  onSyncRow: (username: string) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onManageRegions: (account: Account) => void;
}

export function AccountsTable({
  accounts,
  filter,
  onFilterChange,
  syncingRows,
  onSyncRow,
  onEdit,
  onDelete,
  onManageRegions,
}: AccountsTableProps) {
  const columns = useMemo<ColumnDef<Account>[]>(
    () => [
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => <span className="font-medium">@{row.getValue("username")}</span>,
      },
      {
        accessorKey: "instagram_id",
        header: "Instagram ID",
        enableSorting: false,
        cell: ({ row }) => {
          const id = row.getValue<string | null>("instagram_id");
          return (
            <span
              className={cn(
                "font-mono text-xs",
                id ? "text-muted-foreground" : "text-muted-foreground/40",
              )}
            >
              {id ?? "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "is_external",
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant={row.getValue<boolean>("is_external") ? "outline" : "secondary"}>
            {row.getValue<boolean>("is_external") ? "External" : "Internal"}
          </Badge>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant={row.getValue<boolean>("is_active") ? "default" : "outline"}>
            {row.getValue<boolean>("is_active") ? "Active" : "Inactive"}
          </Badge>
        ),
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
                onClick={() => onManageRegions(account)}
                className="gap-1 text-muted-foreground hover:text-foreground"
                aria-label={`Manage regions for @${account.username}`}
              >
                <MapPin className="size-3" />
                Regions
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onSyncRow(account.username)}
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
                onClick={() => onEdit(account)}
                aria-label={`Edit @${account.username}`}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(account)}
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
    [syncingRows, onSyncRow, onEdit, onDelete, onManageRegions],
  );

  return (
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
              onClick={() => onFilterChange(opt.value)}
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
  );
}

interface AccountRegionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  accountRegions: AccountRegion[];
  loadingRegions: boolean;
  unassignedRegions: Region[];
  onOpenSelector: () => void;
  onRemoveRegion: (regionId: number, accountId: number, regionName: string) => void;
}

export function AccountRegionsDialog({
  open,
  onOpenChange,
  account,
  accountRegions,
  loadingRegions,
  unassignedRegions,
  onOpenSelector,
  onRemoveRegion,
}: AccountRegionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold leading-none">@{account?.username}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {account?.is_external ? "External" : "Internal"} ·{" "}
              <strong className="text-foreground font-medium">
                {accountRegions.length} region{accountRegions.length !== 1 ? "s" : ""}
              </strong>
            </p>
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenSelector}
              disabled={unassignedRegions.length === 0}
            >
              <Plus className="size-4" />
              {unassignedRegions.length === 0 ? "All regions assigned" : "Assign to Region"}
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto min-h-0">
          {loadingRegions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : accountRegions.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-center px-6">
              <MapPin className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Not assigned to any region</p>
              <p className="text-xs text-muted-foreground/60">
                Click "Assign to Region" to add this account to regions
              </p>
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
                {accountRegions.map((ar) => (
                  <TableRow key={ar.id}>
                    <TableCell className="font-medium">{ar.region_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ar.province_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onRemoveRegion(ar.region_id, ar.account_id, ar.region_name)}
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
  );
}

interface RegionSelectorItem {
  id: number;
  name: string;
  province_name: string;
  group_name: string | null;
}

interface RegionSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  available: RegionSelectorItem[];
  onAdd: (regionIds: number[]) => Promise<void>;
  title?: string;
  description?: string;
}

export function RegionSelectorDialog({
  open,
  onOpenChange,
  available,
  onAdd,
  title = "Assign to Regions",
  description,
}: RegionSelectorDialogProps) {
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
    setSelected(allSelected ? new Set() : new Set(filtered.map((r) => r.id)));
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
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent
        className="sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold leading-none">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
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
              {filtered.map((region) => (
                <button
                  key={region.id}
                  onClick={() => toggle(region.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                    selected.has(region.id) ? "bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <CheckboxIcon checked={selected.has(region.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{region.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {region.province_name}
                      {region.group_name && <span className="ml-2">· {region.group_name}</span>}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <DialogFooter>
            <div className="flex items-center gap-2 mr-auto">
              {selected.size > 0 && <Badge variant="secondary">{selected.size} selected</Badge>}
            </div>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={selected.size === 0 || adding}>
              {adding ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Adding...
                </>
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
        checked
          ? "bg-primary border-primary text-primary-foreground"
          : "border-border bg-background",
      )}
      aria-hidden
    >
      {checked && <Check className="size-2.5 stroke-[3]" />}
    </span>
  );
}
