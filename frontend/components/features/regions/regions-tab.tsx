import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { Region } from "@/types";

interface RegionsTabProps {
  regions: Region[];
  tabChips: React.ReactNode;
  onEdit: (region: Region) => void;
  onDelete: (region: Region) => void;
  onManageAccounts: (region: Region) => void;
}

export function RegionsTab({
  regions,
  tabChips,
  onEdit,
  onDelete,
  onManageAccounts,
}: RegionsTabProps) {
  const columns: ColumnDef<Region>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
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
        enableSorting: false,
        cell: ({ row }) => {
          const name = row.getValue<string | null>("group_name");
          return name ? (
            <Badge variant="secondary">{name}</Badge>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          );
        },
      },
      {
        accessorKey: "account_count",
        header: "Accounts",
        cell: ({ row }) => {
          const n = row.getValue<number>("account_count");
          return (
            <Badge variant={n > 0 ? "outline" : "ghost"} className="tabular-nums">
              {n}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => null,
        enableSorting: false,
        size: 160,
        cell: ({ row }) => {
          const region = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onManageAccounts(region)}
                className="gap-1"
                aria-label={`Manage accounts for ${region.name}`}
              >
                <Users className="size-3" />
                Accounts
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onEdit(region)}
                aria-label={`Edit ${region.name}`}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(region)}
                className="hover:text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${region.name}`}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, onManageAccounts],
  );

  if (regions.length === 0) {
    return (
      <>
        {tabChips}
        <EmptyState icon={MapPin} title="No regions yet" description="Create your first region" />
      </>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={regions}
      searchColumn="name"
      searchPlaceholder="Search regions..."
      toolbarLeft={tabChips}
    />
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
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
    </div>
  );
}
