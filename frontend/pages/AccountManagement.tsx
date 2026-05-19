import { useState, useRef, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Loader2, Users, RefreshCcw } from "lucide-react";
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
import { useAccounts, type Account } from "@/hooks/use-accounts";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "external", label: "External" },
  { value: "internal", label: "Internal" },
] as const;

export default function AccountManagement() {
  const { accounts, loading, submitting, filter, setFilter, syncAccountId, addAccount, refetch } =
    useAccounts();

  const [addOpen, setAddOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingRows, setSyncingRows] = useState<Set<string>>(new Set());
  const [newUsername, setNewUsername] = useState("");
  const [newIsExternal, setNewIsExternal] = useState(true);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  async function handleSyncIds() {
    setSyncing(true);
    try {
      const res = await fetch("/api/instagram/profile/sync-ids", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast.success("ID sync started", "Accounts missing Instagram IDs are being resolved in the background.");
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

  // Columns defined inside component so they can access syncingRows / handleSyncRow
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
        size: 80,
        cell: ({ row }) => {
          const username = row.original.username;
          const isSyncing = syncingRows.has(username);
          return (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleSyncRow(username)}
              disabled={isSyncing}
              className="gap-1 text-muted-foreground hover:text-foreground"
              aria-label={`Sync Instagram ID for @${username}`}
              title="Resolve Instagram ID"
            >
              {isSyncing ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RefreshCcw className="size-3" />
              )}
              Sync ID
            </Button>
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
                {[
                  { value: true, label: "External" },
                  { value: false, label: "Internal" },
                ].map((opt) => (
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
    </div>
  );
}
