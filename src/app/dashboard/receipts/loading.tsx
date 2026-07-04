import { Skeleton } from "@/ui/loading";
import { DashboardShell } from "@/dashboard/shell";

export default function ReceiptsLoading() {
  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-8 w-36" />
        </div>
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="flex gap-6 border-b border-border pb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-6 border-t border-border py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
