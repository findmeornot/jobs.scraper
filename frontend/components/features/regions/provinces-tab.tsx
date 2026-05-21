import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { Province } from "@/types";

interface ProvincesTabProps {
  provinces: Province[];
  tabChips: React.ReactNode;
  onEdit: (province: Province) => void;
  onDelete: (province: Province) => void;
}

export function ProvincesTab({ provinces, tabChips, onEdit, onDelete }: ProvincesTabProps) {
  const columns: ColumnDef<Province>[] = useMemo(
    () => [
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
          return (
            <Badge variant={active ? "default" : "outline"}>{active ? "Active" : "Inactive"}</Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => null,
        enableSorting: false,
        size: 80,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(p)}
                aria-label={`Edit ${p.name}`}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(p)}
                className="hover:text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${p.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete],
  );

  if (provinces.length === 0) {
    return (
      <>
        {tabChips}
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MapPin className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No provinces yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add provinces to organize regions</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={provinces}
      searchColumn="name"
      searchPlaceholder="Search provinces..."
      toolbarLeft={tabChips}
    />
  );
}
