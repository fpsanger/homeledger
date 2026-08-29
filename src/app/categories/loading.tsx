import { Skeleton } from "@/components/ui/skeleton";

const HEADER_COLS = ["a", "b", "c", "d"];
const ROWS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ROW_COLS = ["a", "b", "c", "d"];

export default function CategoriesLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 mb-8">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-32" />
        <div className="mt-2 h-px w-12 bg-primary/20 rounded-full" />
      </div>

      {/* Search + view toggle row */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-56 rounded" />
        <div className="flex gap-1">
          <Skeleton className="h-9 w-9 rounded" />
          <Skeleton className="h-9 w-9 rounded" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-muted/40 px-4 py-2.5 flex gap-4">
          {HEADER_COLS.map((col) => (
            <Skeleton key={col} className="h-3 flex-1" />
          ))}
        </div>
        {ROWS.map((row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
            {ROW_COLS.map((col) => (
              <Skeleton key={col} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
