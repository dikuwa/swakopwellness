import { DashboardShell } from "@/dashboard/shell";

export default function NotificationsLoading() {
  return (
    <DashboardShell>
      <div>
        <div className="h-4 w-28 rounded-full bg-surface-muted" />
        <div className="mt-3 h-9 w-56 rounded-xl bg-surface-muted" />
        <div className="mt-3 h-5 w-full max-w-xl rounded-full bg-surface-muted" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 w-28 rounded-xl bg-surface-muted" />
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-surface p-5">
            <div className="h-5 w-2/5 rounded-full bg-surface-muted" />
            <div className="mt-3 h-4 w-3/4 rounded-full bg-surface-muted" />
            <div className="mt-4 h-4 w-1/3 rounded-full bg-surface-muted" />
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
