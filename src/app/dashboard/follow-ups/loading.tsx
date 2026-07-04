import { Skeleton } from "@/ui/loading";
import { DashboardShell } from "@/dashboard/shell";

export default function FollowupsLoading() {
  return (
    <DashboardShell>
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-8 w-40" />
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="mt-2 h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
