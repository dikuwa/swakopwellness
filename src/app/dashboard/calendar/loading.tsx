import { Skeleton } from "@/ui/loading";
import { DashboardShell } from "@/dashboard/shell";

export default function CalendarLoading() {
  return (
    <DashboardShell>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-2 h-8 w-32" />
      <div className="mt-6 grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-surface-muted p-2">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
