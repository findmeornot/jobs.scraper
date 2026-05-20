import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Shared primitives ────────────────────────────────────────────────────────

function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3.5 rounded", className)} />;
}

function SkeletonBadge({ className }: { className?: string }) {
  return <Skeleton className={cn("h-5 w-14 rounded-full", className)} />;
}

// ─── Generic DataTable skeleton ───────────────────────────────────────────────

interface TableSkeletonProps {
  rows?: number;
  cols: Array<{ width?: string; flex?: boolean }>;
}

function TableSkeleton({ rows = 9, cols }: TableSkeletonProps) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 h-11 border-b border-border bg-muted/30">
        {cols.map((col, i) => (
          <Skeleton key={i} className={cn("h-3 rounded", col.flex ? "flex-1" : col.width ?? "w-20")} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className={cn(
            "flex items-center gap-4 px-5 h-12 border-b border-border last:border-0",
            r % 2 === 1 && "bg-muted/10",
          )}
        >
          {cols.map((col, i) => (
            <Skeleton key={i} className={cn("h-3.5 rounded", col.flex ? "flex-1" : col.width ?? "w-24")} style={{ opacity: 1 - r * 0.06 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard skeleton ───────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          "col-span-3", "col-span-2", "col-span-2", "col-span-2", "col-span-3",
        ].map((span, i) => (
          <div key={i} className={cn("rounded-2xl border border-border bg-card p-5 space-y-3", span)}>
            <div className="flex items-start justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="size-9 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Chart row 1 */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7 rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-44 rounded-lg" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
        <div className="col-span-5 flex flex-col gap-3">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 flex-1">
            <Skeleton className="h-4 w-36 rounded-lg" />
            <Skeleton className="h-3 w-48 rounded" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 flex-1">
            <Skeleton className="h-4 w-28 rounded-lg" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-2.5 rounded-full" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
                <Skeleton className="h-3 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart row 2 */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-7 rounded-2xl border border-border bg-card p-5 space-y-4">
          <Skeleton className="h-4 w-36 rounded-lg" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
        <div className="col-span-5 rounded-2xl border border-border bg-card p-5 space-y-4">
          <Skeleton className="h-4 w-36 rounded-lg" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Account Management skeleton ─────────────────────────────────────────────

export function AccountManagementSkeleton() {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-3.5 w-56 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 flex-1 max-w-xs rounded-lg" />
        <div className="flex gap-1.5">
          {["w-10", "w-20", "w-20"].map((w, i) => (
            <Skeleton key={i} className={cn("h-8 rounded-full", w)} />
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          {["w-8", "w-10", "w-10", "w-10", "w-10"].map((w, i) => (
            <Skeleton key={i} className={cn("h-8 rounded", w)} />
          ))}
        </div>
      </div>

      {/* Table */}
      <TableSkeleton
        rows={9}
        cols={[
          { width: "w-32", flex: false },
          { width: "w-36" },
          { width: "w-20" },
          { width: "w-16" },
          { width: "w-16" },
          { width: "w-20" },
          { flex: true },
          { width: "w-28" },
        ]}
      />

      {/* Pagination row */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-3 w-32 rounded" />
        <div className="flex gap-1.5">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Region Management skeleton ───────────────────────────────────────────────

export function RegionManagementSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Toolbar: search + tab chips */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 flex-1 max-w-xs rounded-lg" />
        <div className="flex gap-1.5">
          {["w-20", "w-24", "w-20"].map((w, i) => (
            <Skeleton key={i} className={cn("h-8 rounded-full", w)} />
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          {["w-8", "w-10", "w-10", "w-10", "w-10"].map((w, i) => (
            <Skeleton key={i} className={cn("h-8 rounded", w)} />
          ))}
        </div>
      </div>

      <TableSkeleton
        rows={9}
        cols={[
          { width: "w-40", flex: false },
          { width: "w-32" },
          { width: "w-24" },
          { width: "w-16" },
          { flex: true },
          { width: "w-36" },
        ]}
      />
    </div>
  );
}

// ─── Logs skeleton ────────────────────────────────────────────────────────────

export function LogsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-28 rounded-lg" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-end gap-1">
        {["w-8", "w-10", "w-10", "w-10", "w-10"].map((w, i) => (
          <Skeleton key={i} className={cn("h-8 rounded", w)} />
        ))}
      </div>

      <TableSkeleton
        rows={9}
        cols={[
          { width: "w-32" },
          { width: "w-20" },
          { width: "w-16" },
          { width: "w-14" },
          { width: "w-14" },
          { width: "w-14" },
          { width: "w-24" },
          { flex: true },
          { width: "w-14" },
        ]}
      />
    </div>
  );
}

// ─── Content skeleton ─────────────────────────────────────────────────────────

function ContentCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-4/5 rounded" />
        <Skeleton className="h-3 w-3/5 rounded" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ContentSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-32 rounded" />
          <Skeleton className="h-3 w-8 rounded" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      {/* Group tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {["w-16", "w-24", "w-20", "w-28", "w-20", "w-24", "w-20"].map((w, i) => (
          <Skeleton key={i} className={cn("h-8 rounded-full", w)} />
        ))}
      </div>

      {/* Group section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="flex-1 h-1 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Second group section (faded) */}
      <div className="space-y-3 opacity-50">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-20 rounded-lg" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="flex-1 h-1 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
