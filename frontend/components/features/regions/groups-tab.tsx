import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, FolderOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { Group, Region } from "@/types";

interface GroupsTabProps {
  groups: Group[];
  regions: Region[];
  tabChips: React.ReactNode;
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
  onViewDetails: (group: Group) => void;
}

export function GroupsTab({ groups, regions, tabChips, onEdit, onDelete, onViewDetails }: GroupsTabProps) {
  const columns: ColumnDef<Group>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const active = row.getValue<boolean>("is_active");
        return <Badge variant={active ? "default" : "outline"}>{active ? "Active" : "Inactive"}</Badge>;
      },
    },
    {
      id: "region_count",
      header: "Regions",
      enableSorting: false,
      cell: ({ row }) => {
        const count = regions.filter((r) => r.group_id === row.original.id).length;
        return <Badge variant={count > 0 ? "secondary" : "ghost"} className="tabular-nums">{count}</Badge>;
      },
    },
    {
      id: "actions",
      header: () => null,
      enableSorting: false,
      size: 120,
      cell: ({ row }) => {
        const g = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="xs" onClick={() => onViewDetails(g)} className="gap-1">
              <FolderOpen className="size-3" />Details
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => onEdit(g)} aria-label={`Edit ${g.name}`}>
              <Pencil className="size-3" />
            </Button>
            <Button
              variant="ghost" size="icon-xs"
              onClick={() => onDelete(g)}
              className="hover:text-destructive hover:bg-destructive/10"
              aria-label={`Delete ${g.name}`}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        );
      },
    },
  ], [regions, onEdit, onDelete, onViewDetails]);

  if (groups.length === 0) {
    return (
      <>
        {tabChips}
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Layers className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No groups yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create groups to categorize content</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={groups}
      searchColumn="name"
      searchPlaceholder="Search groups..."
      toolbarLeft={tabChips}
    />
  );
}
