import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [9, 18, 32, 64, "all"] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  searchColumn?: string;
  searchPlaceholder?: string;
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp className="size-3" />;
  if (sorted === "desc") return <ChevronDown className="size-3" />;
  return <ChevronsUpDown className="size-3 text-muted-foreground/50" />;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 9,
  searchColumn,
  searchPlaceholder = "Search...",
  toolbarLeft,
  toolbarRight,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pageSizeOpt, setPageSizeOpt] = React.useState<PageSizeOption>(pageSize as PageSizeOption);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  function handlePageSizeChange(opt: PageSizeOption) {
    setPageSizeOpt(opt);
    table.setPageIndex(0);
    table.setPageSize(opt === "all" ? 99999 : opt);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          {searchColumn && (
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={
                  (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
                }
                onChange={(e) =>
                  table.getColumn(searchColumn)?.setFilterValue(e.target.value)
                }
                className="pl-8"
              />
            </div>
          )}
          {toolbarLeft}
        </div>
        <div className="flex items-center gap-1.5">
          {toolbarRight}
          <div className="flex gap-1">
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <button
                key={String(opt)}
                type="button"
                onClick={() => handlePageSizeChange(opt)}
                className={cn(
                  "h-8 min-w-8 rounded px-2 text-xs font-medium transition-colors border",
                  pageSizeOpt === opt
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "inline-flex items-center gap-1 hover:text-foreground transition-colors select-none",
                            header.column.getIsSorted() && "text-foreground",
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <SortIcon sorted={header.column.getIsSorted()} />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} row(s) ·{" "}
            page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
