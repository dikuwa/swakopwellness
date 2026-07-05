import Link from "next/link";
import type { Metadata } from "next";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDb } from "@/db/client";
import { bookings, clients } from "@/db/schema";
import { Badge, Card } from "@/ui/components";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendar — Swakop Wellness Centre",
};

// Use the shared badge component logic from the dashboard
function bookingBadge(status: string): { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "muted" } {
  const map: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "muted" }> = {
    new_request: { label: "New Request", variant: "warning" },
    requires_review: { label: "Requires Review", variant: "danger" },
    confirmed: { label: "Confirmed", variant: "success" },
    completed: { label: "Completed", variant: "primary" },
    cancelled: { label: "Cancelled", variant: "muted" },
    contacting_client: { label: "Contacting", variant: "warning" },
    awaiting_client_response: { label: "Awaiting", variant: "warning" },
    rescheduled: { label: "Rescheduled", variant: "primary" },
    no_show: { label: "No-show", variant: "danger" },
  };
  return map[status] ?? { label: status.replaceAll("_", " "), variant: "default" };
}

function formatDateHeader(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}

function endOfDay(dateStr: string) {
  return new Date(`${dateStr}T23:59:59`);
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function getSunday(d: Date) {
  const monday = getMonday(d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

function getLastOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

interface BookingRow {
  id: string;
  reference: string;
  preferredAt: Date;
  status: string;
  clientName: string | null;
  serviceName: string;
}

function groupByDate(bookings: BookingRow[]): [string, BookingRow[]][] {
  const groups = new Map<string, BookingRow[]>();
  for (const b of bookings) {
    const key = toISODate(b.preferredAt);
    const list = groups.get(key) ?? [];
    list.push(b);
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

function CompactStat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface-muted p-3 ${className || ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default async function DashboardCalendarPage(props: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requirePermission("bookings:view");
  const db = getDb();

  const sp = await props.searchParams;

  const today = new Date();
  const todayStr = toISODate(today);

  const fromStr = sp.from ?? todayStr;
  const toStr = sp.to ?? toISODate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));

  const fromDate = startOfDay(fromStr);
  const toDate = endOfDay(toStr);

  const allBookings = await db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      preferredAt: bookings.preferredAt,
      status: bookings.status,
      clientName: clients.fullName,
      serviceName: bookings.serviceName,
    })
    .from(bookings)
    .leftJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(gte(bookings.preferredAt, fromDate), lte(bookings.preferredAt, toDate)))
    .orderBy(asc(bookings.preferredAt))
    .limit(200); // Increased limit slightly

  const grouped = groupByDate(allBookings);

  // Calculate summary stats
  const totalAppointments = allBookings.length;
  const confirmedCount = allBookings.filter(b => b.status === 'confirmed').length;
  const reviewCount = allBookings.filter(b => b.status === 'requires_review').length;
  const newRequestCount = allBookings.filter(b => b.status === 'new_request').length;

  const todayUrl = `/dashboard/calendar?from=${todayStr}&to=${todayStr}`;

  const thisMonday = getMonday(today);
  const thisSunday = getSunday(today);
  const weekUrl = `/dashboard/calendar?from=${toISODate(thisMonday)}&to=${toISODate(thisSunday)}`;

  const firstOfMonth = toISODate(new Date(today.getFullYear(), today.getMonth(), 1));
  const lastOfMonth = toISODate(getLastOfMonth(today));
  const monthUrl = `/dashboard/calendar?from=${firstOfMonth}&to=${lastOfMonth}`;

  const thirtyDaysUrl = `/dashboard/calendar?from=${todayStr}&to=${toISODate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000))}`;

  const activeClass = (href: string) => {
    const params = new URLSearchParams(href.split("?")[1] ?? "");
    const f = params.get("from");
    const t = params.get("to");
    return f === fromStr && t === toStr ? "bg-surface-muted font-semibold text-foreground" : "text-muted-foreground";
  };

  return (
    <DashboardShell>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Planning</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-[-0.03em]">Calendar</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={todayUrl} className={`rounded-xl border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-muted hover:text-foreground ${activeClass(todayUrl)}`}>Today</Link>
          <Link href={weekUrl} className={`rounded-xl border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-muted hover:text-foreground ${activeClass(weekUrl)}`}>This Week</Link>
          <Link href={monthUrl} className={`rounded-xl border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-muted hover:text-foreground ${activeClass(monthUrl)}`}>This Month</Link>
          <Link href={thirtyDaysUrl} className={`rounded-xl border border-border px-3 py-1.5 text-xs transition-colors hover:bg-surface-muted hover:text-foreground ${activeClass(thirtyDaysUrl)}`}>30 Days</Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CompactStat label="Total Appointments" value={totalAppointments} />
        <CompactStat label="Confirmed" value={confirmedCount} className="text-success" />
        <CompactStat label="Requires Review" value={reviewCount} className="text-danger" />
        <CompactStat label="New Requests" value={newRequestCount} className="text-warning" />
      </div>

      <Card className="mt-6">
        {grouped.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <p>No appointments found for this period.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium">Service</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Booking ID</th>
                    <th className="px-5 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map(([dateKey, dateBookings]) => (
                    <>
                      <tr key={dateKey} className="border-b border-border bg-surface-muted">
                        <td colSpan={5} className="px-5 py-2 text-sm font-semibold text-foreground">
                          {formatDateHeader(new Date(dateKey + "T12:00:00"))}
                        </td>
                      </tr>
                      {dateBookings.map((b) => {
                        const badge = bookingBadge(b.status);
                        return (
                          <tr key={b.id} className="border-b border-border transition-colors last:border-none hover:bg-surface-muted/50">
                            <td className="px-5 py-3 font-semibold text-primary">{formatTime(b.preferredAt)}</td>
                            <td className="px-5 py-3 font-semibold">
                              <Link href={`/dashboard/bookings/${b.id}`} className="hover:underline">{b.serviceName}</Link>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">{b.clientName}</td>
                            <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{b.reference}</td>
                            <td className="px-5 py-3 text-right">
                              <Badge variant={badge.variant}>{badge.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="divide-y divide-border md:hidden">
              {grouped.map(([dateKey, dateBookings]) => (
                <div key={dateKey}>
                  <div className="bg-surface-muted px-4 py-2">
                     <h2 className="text-sm font-semibold text-foreground">{formatDateHeader(new Date(dateKey + "T12:00:00"))}</h2>
                  </div>
                  {dateBookings.map((b) => {
                    const badge = bookingBadge(b.status);
                    return (
                      <Link key={b.id} href={`/dashboard/bookings/${b.id}`} className="block px-4 py-3 transition-colors hover:bg-surface-muted/50">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{b.serviceName}</p>
                            <p className="text-sm text-muted-foreground">{b.clientName}</p>
                          </div>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-primary">{formatTime(b.preferredAt)}</span>
                          <span className="font-mono text-xs text-muted-foreground">{b.reference}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </DashboardShell>
  );
}