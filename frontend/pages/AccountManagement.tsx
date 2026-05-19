import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Loader2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import { useAccounts, type Account } from "@/hooks/use-accounts";

const columns: ColumnDef<Account>[] = [
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
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue("instagram_id") ?? "—"}
      </span>
    ),
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
];

export default function AccountManagement() {
  const {
    loading,
    submitting,
    filter,
    setFilter,
    filteredAccounts,
    addAccount,
  } = useAccounts();

  const [addOpen, setAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newIsExternal, setNewIsExternal] = useState(true);

  const tableData = useMemo(() => filteredAccounts, [filteredAccounts]);

  async function handleAdd() {
    const ok = await addAccount(newUsername, newIsExternal);
    if (ok) {
      setAddOpen(false);
      setNewUsername("");
      setNewIsExternal(true);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Accounts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage Instagram accounts
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="size-4" />
          Add Account
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          searchColumn="username"
          searchPlaceholder="Search username..."
          toolbarLeft={
            <Select
              value={filter}
              onValueChange={(v) =>
                setFilter(v as "all" | "external" | "internal")
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="external">External</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      )}

      <Dialog open={addOpen} onOpenChange={(open) => setAddOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Instagram Account</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-username"
                className="text-xs font-medium text-foreground"
              >
                Username
              </label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. company_account"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newUsername.trim()) handleAdd();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Type
              </label>
              <Select
                value={newIsExternal ? "external" : "internal"}
                onValueChange={(v) => setNewIsExternal(v === "external")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">External</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={submitting || !newUsername.trim()}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Adding...
                </>
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
