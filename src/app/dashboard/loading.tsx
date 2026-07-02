import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function StatCardSkeleton() {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-28" />
      </div>
      <Skeleton className="h-4 w-4 rounded-full" />
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-40 mt-0.5" />
          <div className="mt-2 h-px w-12 bg-primary/20 rounded-full" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Annual report card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="flex flex-col gap-0">
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-32 mt-1" />
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <Skeleton className="h-52 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly summary card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Skeleton className="h-5 w-28" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Card className="p-5 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-36" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="h-px bg-border" />
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
