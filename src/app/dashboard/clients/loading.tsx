import { Skeleton } from "@/ui/loading";
import { DashboardShell } from "@/dashboard/shell";

export default function ClientsLoading() {
  return (
    <DashboardShell>
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-8 w-32" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="flex gap-6 border-b border-border pb-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-6 border-t border-border py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
