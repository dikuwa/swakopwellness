import { count, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireAuth } from "@/auth/session";
import { DashboardLayout } from "@/dashboard/components";
import { StatCard } from "@/ui/components";
import { bookings, clients, followUps, invoices, notifications, quotations } from "@/db/schema";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const db = getDb();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [bookingCount] = await db.select({ value: count() }).from(bookings);
  const [newRequests] = await db.select({ value: count() }).from(bookings).where(eq(bookings.status, "new_request"));
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const [todayBookings] = await db.select({ value: count() }).from(bookings).where(sql`${bookings.preferredAt} >= ${todayStart.toISOString()} AND ${bookings.preferredAt} < ${todayEnd.toISOString()}`);
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
  const [pendingQuotations] = await db
    .select({ value: count() })
    .from(quotations)
    .where(inArray(quotations.status, ["draft", "issued"]));
  const [unreadNotifications] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(notifications)
    .where(sql`${notifications.userId} = ${user.id} AND ${notifications.readAt} IS NULL`);

  const stats = [
    { label: "Total Bookings", value: bookingCount.value },
    { label: "New Requests", value: newRequests.value, variant: "emphasis" as const },
    { label: "Today", value: todayBookings.value },
    { label: "Requires Review", value: requiresReview.value, variant: "warn" as const },
    { label: "Clients", value: clientCount.value },
    { label: "Follow-ups Due", value: followUpsDue.value },
    { label: "Outstanding Invoices", value: outstandingInvoices.value },
    { label: "Pending Quotations", value: pendingQuotations.value },
    { label: "Unread Notifications", value: unreadNotifications.value },
  ];

  return (
    <DashboardLayout
      signOutForm={
        <form action={logoutAction}>
          <button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">
            Sign out
          </button>
        </form>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Overview</p>
          <h1 className="mt-2 text-2xl sm:text-3xl tracking-[-0.03em]">Welcome, {user.name}</h1>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} variant={s.variant} />
        ))}
      </div>
    </DashboardLayout>
  );
}
