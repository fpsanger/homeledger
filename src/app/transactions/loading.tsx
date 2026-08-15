import { Skeleton } from "@/components/ui/skeleton";

const COL_KEYS = ["a", "b", "c", "d", "e", "f"];

function SummaryCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-1.5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-28" />
    </div>
  );
}

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
      {COL_KEYS.slice(0, cols).map((col) => (
        <Skeleton key={col} className="h-4 flex-1" />
      ))}
    </div>
  );
}

const SUMMARY_CARDS = ["a", "b", "c", "d"];
const ROWS_5 = ["a", "b", "c", "d", "e"];
const ROWS_4 = ["a", "b", "c", "d"];

export default function TransactionsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 mb-8">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3 w-32 mt-0.5" />
        <div className="mt-2 h-px w-12 bg-primary/20 rounded-full" />
      </div>

      {/* Month nav + buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded" />
          <Skeleton className="h-9 w-32 rounded" />
          <Skeleton className="h-9 w-40 rounded" />
        </div>
      </div>

      {/* Unified filter group */}
      <div className="rounded-lg border bg-card p-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-48 rounded" />
            <Skeleton className="h-8 w-44 rounded" />
            <Skeleton className="h-8 w-40 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-16" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-40 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-10" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-36 rounded" />
            <Skeleton className="h-8 w-28 rounded" />
          </div>
        </div>
      </div>

      {/* Transactions section */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCardSkeleton key={card} />
          ))}
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 flex gap-4">
            {COL_KEYS.map((col) => (
              <Skeleton key={col} className="h-3 flex-1" />
            ))}
          </div>
          {ROWS_5.map((row) => (
            <TableRowSkeleton key={row} cols={6} />
          ))}
        </div>
      </div>

      {/* Parcelas section */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-20" />

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/40 px-4 py-2.5 flex gap-4">
            {COL_KEYS.slice(0, 5).map((col) => (
              <Skeleton key={col} className="h-3 flex-1" />
            ))}
          </div>
          {ROWS_4.map((row) => (
            <TableRowSkeleton key={row} cols={5} />
          ))}
        </div>
      </div>
    </div>
  );
}
