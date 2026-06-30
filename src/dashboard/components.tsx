import Link from "next/link";

export function DashboardNav() {
  return (
    <nav aria-label="Dashboard navigation" className="mb-6 flex flex-wrap gap-2 text-sm">
      <Link href="/dashboard" className="rounded-xl border border-border px-3 py-2 font-semibold hover:bg-surface-muted">Overview</Link>
      <Link href="/dashboard/bookings" className="rounded-xl border border-border px-3 py-2 font-semibold hover:bg-surface-muted">Bookings</Link>
      <Link href="/dashboard/calendar" className="rounded-xl border border-border px-3 py-2 font-semibold hover:bg-surface-muted">Calendar</Link>
      <Link href="/dashboard/follow-ups" className="rounded-xl border border-border px-3 py-2 font-semibold hover:bg-surface-muted">Follow-ups</Link>
    </nav>
  );
}
