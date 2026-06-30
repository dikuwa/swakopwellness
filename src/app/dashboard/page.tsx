import { count, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireAuth } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { bookings, clients, followUps, invoices, notifications } from "@/db/schema";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const db = getDb();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [bookingCount] = await db.select({ value: count() }).from(bookings);
  const [newRequests] = await db.select({ value: count() }).from(bookings).where(eq(bookings.status, "new_request"));
  const [todayBookings] = await db.select({ value: count() }).from(bookings).where(sql`${bookings.preferredAt} >= ${todayStart} AND ${bookings.preferredAt} < ${new Date(todayStart.getTime() + 86400000)}`);
  const [requiresReview] = await db.select({ value: count() }).from(bookings).where(eq(bookings.status, "requires_review"));
  const [clientCount] = await db.select({ value: count() }).from(clients);
  const [followUpsDue] = await db
    .select({ value: count() })
    .from(followUps)
    .where(inArray(followUps.status, ["pending", "due_today"]));
  const [outstandingInvoices] = await db
    .select({ value: count() })
    .from(invoices)
    .where(inArray(invoices.status, ["issued", "partially_paid", "overdue"]));
  const [unreadNotifications] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(notifications)
    .where(sql`${notifications.userId} = ${user.id} AND ${notifications.readAt} IS NULL`);

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
        <DashboardNav />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Welcome, {user.name}</h1>
            <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">
              Review bookings, clients, follow-ups, invoices and payments.
            </p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="h-11 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted">
              Sign out
            </button>
          </form>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total Bookings" value={bookingCount.value} />
          <StatCard label="New Requests" value={newRequests.value} emphasis />
          <StatCard label="Today" value={todayBookings.value} />
          <StatCard label="Requires Review" value={requiresReview.value} warn />
          <StatCard label="Clients" value={clientCount.value} />
          <StatCard label="Follow-ups Due" value={followUpsDue.value} />
          <StatCard label="Outstanding Invoices" value={outstandingInvoices.value} />
          <StatCard label="Unread Notifications" value={unreadNotifications.value} />
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, emphasis, warn }: { label: string; value: number; emphasis?: boolean; warn?: boolean }) {
  const colorClass = emphasis ? "text-[oklch(0.49_0.16_158)]" : warn ? "text-[oklch(0.55_0.20_36)]" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${colorClass}`}>{value}</p>
    </div>
  );
}
