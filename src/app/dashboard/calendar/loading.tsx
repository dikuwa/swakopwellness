import { Skeleton } from "@/ui/loading";
import { DashboardShell } from "@/dashboard/shell";
import { Card } from "@/ui/components";

export default function CalendarLoading() {
  return (
    <DashboardShell>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-8 w-32" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16" />
          ))}
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[46px] w-full" />
        ))}
      </div>

      {/* Agenda Card Skeleton */}
      <Card className="mt-6 p-4">
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    </DashboardShell>
  );
}

