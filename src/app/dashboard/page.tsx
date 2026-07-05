import { count, eq, inArray, sql, and, desc, asc, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requireAuth } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { StatCard, Badge, Card, LinkButton, PageHeading } from "@/ui/components";
import {
  bookings, clients, followUps, invoices, notifications, payments,
  activityLog, users, quotations,
} from "@/db/schema";
import Link from "next/link";


export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB");
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function bookingBadge(status: string): { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "muted" } {
  const map: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "muted" }> = {
    new_request: { label: "New", variant: "warning" },
    requires_review: { label: "Review", variant: "danger" },
    confirmed: { label: "Confirmed", variant: "success" },
    completed: { label: "Completed", variant: "primary" },
    cancelled: { label: "Cancelled", variant: "muted" },
    contacting_client: { label: "Contacting", variant: "warning" },
    awaiting_client_response: { label: "Awaiting", variant: "warning" },
    rescheduled: { label: "Rescheduled", variant: "primary" },
    no_show: { label: "No-show", variant: "danger" },
  };
  return map[status] ?? { label: status, variant: "default" };
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const db = getDb();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayDateStr = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const [
    [newRequests],
    [todayBookingsCount],
    [clientCount],
    [followUpsDueCount],
    [outstandingInvoicesCount],
    [pendingQuotationsCount],
    [unreadNotificationsResult],
    [requiresReviewCount],
    [overdueFollowUpsCount],
    [outstandingTotal],
    [revenue30d],
    todaySchedule,
    upcomingBookings,
    followUpsDue,
    recentActivity,
  ] = await Promise.all([
    db.select({ value: count() }).from(bookings).where(eq(bookings.status, "new_request")),
    db.select({ value: count() }).from(bookings).where(sql`${bookings.preferredAt} >= ${todayStart.toISOString()} AND ${bookings.preferredAt} < ${todayEnd.toISOString()}`),
    db.select({ value: count() }).from(clients),
    db.select({ value: count() }).from(followUps).where(inArray(followUps.status, ["pending", "due_today"])),
    db.select({ value: count() }).from(invoices).where(inArray(invoices.status, ["issued", "partially_paid", "overdue"])),
    db.select({ value: count() }).from(quotations).where(inArray(quotations.status, ["draft", "issued"])),
    db.select({ value: sql<number>`count(*)::int` }).from(notifications).where(sql`${notifications.userId} = ${user.id} AND ${notifications.readAt} IS NULL`),
    db.select({ value: count() }).from(bookings).where(eq(bookings.status, "requires_review")),
    db.select({ value: count() }).from(followUps).where(and(eq(followUps.status, "pending"), sql`${followUps.dueAt} < ${now.toISOString()}`)),
    db.select({ value: sql<number>`coalesce(sum(${invoices.balanceCents}), 0)::int` }).from(invoices).where(inArray(invoices.status, ["issued", "partially_paid", "overdue"])),
    db.select({ value: sql<number>`coalesce(sum(${payments.amountCents}), 0)::int` }).from(payments).where(and(sql`${payments.paymentDate} >= ${thirtyDaysAgo.toISOString()}`, isNull(payments.voidedAt))),
    db.select({ id: bookings.id, reference: bookings.reference, clientId: bookings.clientId, serviceName: bookings.serviceName, preferredAt: bookings.preferredAt, status: bookings.status, clientName: clients.fullName }).from(bookings).innerJoin(clients, eq(bookings.clientId, clients.id)).where(sql`${bookings.preferredAt} >= ${todayStart.toISOString()} AND ${bookings.preferredAt} < ${todayEnd.toISOString()}`).orderBy(asc(bookings.preferredAt)),
    db.select({ id: bookings.id, reference: bookings.reference, clientId: bookings.clientId, serviceName: bookings.serviceName, preferredAt: bookings.preferredAt, status: bookings.status, clientName: clients.fullName }).from(bookings).innerJoin(clients, eq(bookings.clientId, clients.id)).where(sql`${bookings.preferredAt} > ${todayEnd.toISOString()}`).orderBy(asc(bookings.preferredAt)).limit(50),
    db.select({ id: followUps.id, dueAt: followUps.dueAt, method: followUps.method, status: followUps.status, internalNote: followUps.internalNote, clientName: clients.fullName, bookingReference: bookings.reference }).from(followUps).innerJoin(clients, eq(followUps.clientId, clients.id)).leftJoin(bookings, eq(followUps.bookingId, bookings.id)).where(and(eq(followUps.status, "pending"), sql`${followUps.dueAt} < ${todayEnd.toISOString()}`)).orderBy(asc(followUps.dueAt)).limit(10),
    db.select({ id: activityLog.id, action: activityLog.action, summary: activityLog.summary, createdAt: activityLog.createdAt, userName: users.name }).from(activityLog).leftJoin(users, eq(activityLog.userId, users.id)).orderBy(desc(activityLog.createdAt)).limit(10),
  ]);

  const fmtCurrency = (cents: number) => `N$${(cents / 100).toFixed(2)}`;

  const hasAlerts = requiresReviewCount.value > 0 || overdueFollowUpsCount.value > 0 || unreadNotificationsResult.value > 0;

  const kpiCards = [
    { label: "New Requests", value: newRequests.value, variant: "emphasis" as const },
    { label: "Today", value: todayBookingsCount.value, variant: "emphasis" as const },
    { label: "Clients", value: clientCount.value, variant: "default" as const },
    { label: "Follow-ups Due", value: followUpsDueCount.value, variant: "default" as const },
    { label: "Outstanding Invoices", value: outstandingInvoicesCount.value, variant: outstandingInvoicesCount.value > 0 ? "warn" as const : "default" as const },
    { label: "Pending Quotes", value: pendingQuotationsCount.value, variant: "default" as const },
  ];

  return (
    <DashboardShell>
      <PageHeading pre="Overview" title={`${greeting}, ${user.name}`} description={todayDateStr} />

      {/* Quick actions and alerts row */}
      <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <LinkButton href="/dashboard/bookings/new" variant="secondary" size="sm">New Booking</LinkButton>
          <LinkButton href="/dashboard/invoices/new" variant="secondary" size="sm">New Invoice</LinkButton>
          <LinkButton href="/dashboard/receipts/new" variant="secondary" size="sm">New Receipt</LinkButton>
          <LinkButton href="/dashboard/clients" variant="secondary" size="sm">Clients</LinkButton>
          <LinkButton href="/dashboard/follow-ups" variant="secondary" size="sm">Follow-ups</LinkButton>
        </div>

        {/* Alert chips */}
        {hasAlerts ? (
          <div className="flex flex-wrap items-center gap-3">
            {requiresReviewCount.value > 0 ? (
              <Link
                href="/dashboard/bookings"
                className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/5 px-3 py-2 text-xs font-medium text-warning transition-colors hover:bg-warning/10"
              >
                <WarningIcon />
                {requiresReviewCount.value} booking(s) require review
              </Link>
            ) : null}
            {overdueFollowUpsCount.value > 0 ? (
              <Link
                href="/dashboard/follow-ups"
                className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <WarningIcon />
                {overdueFollowUpsCount.value} follow-up(s) overdue
              </Link>
            ) : null}
            {unreadNotificationsResult.value > 0 ? (
              <Link
                href="/dashboard/notifications"
                className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <BellIcon />
                {unreadNotificationsResult.value} unread notification(s)
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {kpiCards.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} variant={s.variant} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <div className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-[-0.035em]">Today</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{todayDateStr}</p>
              {todaySchedule.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No appointments scheduled for today.</p>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {todaySchedule.map((b) => {
                    const badge = bookingBadge(b.status);
                    return (
                      <div key={b.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="whitespace-nowrap text-sm font-semibold text-primary">{formatTime(b.preferredAt)}</span>
                          <div className="min-w-0">
                            <Link href={`/dashboard/clients/${b.clientId}`} className="text-sm font-semibold text-foreground transition-colors hover:text-primary">
                              {b.clientName}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">{b.serviceName}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden text-xs text-muted-foreground sm:inline">{b.reference}</span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-[-0.035em]">Upcoming</h2>
              {upcomingBookings.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No upcoming appointments.</p>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {upcomingBookings.map((b) => {
                    const badge = bookingBadge(b.status);
                    return (
                      <div key={b.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="whitespace-nowrap text-right">
                            <p className="text-sm font-semibold text-primary">{formatTime(b.preferredAt)}</p>
                            <p className="text-xs text-muted-foreground">{b.preferredAt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
                          </div>
                          <div className="min-w-0">
                            <Link href={`/dashboard/clients/${b.clientId}`} className="text-sm font-semibold text-foreground transition-colors hover:text-primary">
                              {b.clientName}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">{b.serviceName}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden text-xs text-muted-foreground sm:inline">{b.reference}</span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-[-0.035em]">Follow-ups Due Today</h2>
                <Link href="/dashboard/follow-ups" className="text-xs font-medium text-primary transition-colors hover:text-primary/80">
                  View all &rarr;
                </Link>
              </div>
              {followUpsDue.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No follow-ups due.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {followUpsDue.map((fu) => (
                    <div key={fu.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{fu.clientName}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-surface px-2 py-0.5 font-medium">{fu.method}</span>
                          <span>{formatTime(fu.dueAt)}</span>
                        </div>
                        {fu.internalNote ? (
                          <p className="mt-1 truncate text-xs text-muted-foreground">{fu.internalNote}</p>
                        ) : null}
                      </div>
                      <Badge variant={fu.status === "due_today" ? "warning" : "default"}>
                        {fu.status === "due_today" ? "Due Today" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-[-0.035em]">Finance Summary</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                  <span className="text-sm font-semibold text-foreground">{fmtCurrency(outstandingTotal.value)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-muted p-3">
                  <span className="text-sm text-muted-foreground">Revenue (30d)</span>
                  <span className="text-sm font-semibold text-primary">{fmtCurrency(revenue30d.value)}</span>
                </div>
              </div>
              <Link href="/dashboard/invoices" className="mt-3 inline-block text-sm font-medium text-primary transition-colors hover:text-primary/80">
                View Invoices &rarr;
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-[-0.035em]">Recent Activity</h2>
            <Link href="/dashboard/activity-log" className="text-xs font-medium text-primary transition-colors hover:text-primary/80">
              View all &rarr;
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4 py-2.5 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{a.summary}</p>
                    <p className="text-xs text-muted-foreground">{a.userName ?? "System"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </DashboardShell>
  );
}
