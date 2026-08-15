import { Skeleton } from "@/components/ui/skeleton";

const PURCHASE_CARDS = ["a", "b", "c", "d", "e", "f"];

function PurchaseCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 flex-1 rounded-full" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

export default function InstallmentsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 mb-8">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3 w-36 mt-0.5" />
        <div className="mt-2 h-px w-12 bg-primary/20 rounded-full" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-8 w-36 rounded" />
        <Skeleton className="h-8 w-40 rounded" />
        <Skeleton className="h-8 w-44 rounded" />
      </div>

      {/* Purchase cards */}
      <div className="flex flex-col gap-3">
        {PURCHASE_CARDS.map((card) => (
          <PurchaseCardSkeleton key={card} />
        ))}
      </div>
    </div>
  );
}
