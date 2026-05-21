import { useState, useMemo } from "react";
import { Search, Check, Users, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Account } from "@/types";

interface AccountSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  available: Account[];
  onAdd: (accountIds: number[]) => Promise<void>;
  title?: string;
  description?: string;
}

export function AccountSelector({
  open,
  onOpenChange,
  available,
  onAdd,
  title = "Assign Accounts",
  description,
}: AccountSelectorProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? available.filter(
          (a) =>
            a.username.toLowerCase().includes(q) ||
            (a.instagram_id ?? "").toLowerCase().includes(q),
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
    if (filtered.length > 0 && filtered.every((a) => selected.has(a.id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
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

  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

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
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold leading-none">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search by username or Instagram ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Select all */}
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-b border-border shrink-0">
            <button
              onClick={toggleAll}
              className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <Checkbox checked={allFilteredSelected} />
              Select all ({filtered.length})
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {available.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-center">
              <Users className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">All accounts already assigned</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No accounts match "{search}"
            </div>
          ) : (
            <div className="px-2 py-1.5 space-y-0.5">
              {filtered.map((account) => {
                const isSelected = selected.has(account.id);
                return (
                  <button
                    key={account.id}
                    onClick={() => toggle(account.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                      isSelected ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <Checkbox checked={isSelected} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">@{account.username}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {account.instagram_id ?? "No ID"}
                        {account.followers > 0 && (
                          <span className="ml-2 font-sans">
                            · {account.followers.toLocaleString()} followers
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={account.is_external ? "outline" : "secondary"}
                      className="shrink-0"
                    >
                      {account.is_external ? "Ext" : "Int"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
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
                `Add ${selected.size > 0 ? selected.size : ""} Account${selected.size !== 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
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
