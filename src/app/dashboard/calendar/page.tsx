import Link from "next/link";
import type { Metadata } from "next";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDb } from "@/db/client";
import { bookings, clients } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendar — Swakop Wellness Centre",
};

const statusStyles: Record<string, string> = {
  new_request: "bg-blue-100 text-blue-700",
  requires_review: "bg-amber-100 text-amber-700",
  contacting_client: "bg-purple-100 text-purple-700",
  awaiting_client_response: "bg-orange-100 text-orange-700",
  confirmed: "bg-green-100 text-green-700",
  rescheduled: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function formatDateHeader(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
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

function groupByDate(bookings: BookingRow[]): Map<string, BookingRow[]> {
  const groups = new Map<string, BookingRow[]>();
  for (const b of bookings) {
    const key = toISODate(b.preferredAt);
    const list = groups.get(key) ?? [];
    list.push(b);
    groups.set(key, list);
  }
  return groups;
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
    .limit(100);

  const grouped = groupByDate(allBookings);

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
    return f === fromStr && t === toStr ? "bg-surface-muted font-semibold" : "";
  };

  return (
    <DashboardShell>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Planning</p>
          <h1 className="mt-2 text-2xl sm:text-3xl tracking-[-0.03em]">Calendar</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={todayUrl}
            className={`rounded-xl border border-border px-3 py-2 text-xs hover:bg-surface-muted ${activeClass(todayUrl)}`}
          >
            Today
          </Link>
          <Link
            href={weekUrl}
            className={`rounded-xl border border-border px-3 py-2 text-xs hover:bg-surface-muted ${activeClass(weekUrl)}`}
          >
            This Week
          </Link>
          <Link
            href={monthUrl}
            className={`rounded-xl border border-border px-3 py-2 text-xs hover:bg-surface-muted ${activeClass(monthUrl)}`}
          >
            This Month
          </Link>
          <Link
            href={thirtyDaysUrl}
            className={`rounded-xl border border-border px-3 py-2 text-xs hover:bg-surface-muted ${activeClass(thirtyDaysUrl)}`}
          >
            30 Days
          </Link>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {grouped.size === 0 && (
          <p className="text-sm text-muted-foreground">No bookings in this date range.</p>
        )}
        {Array.from(grouped.entries()).map(([dateKey, dateBookings]) => (
          <section key={dateKey}>
            <h2 className="mb-3 text-lg font-semibold tracking-[-0.02em]">
              {formatDateHeader(new Date(dateKey + "T12:00:00"))}
            </h2>
            <div className="space-y-2">
              {dateBookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/dashboard/bookings/${b.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-surface-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <span className="min-w-[4.5rem] text-sm font-medium tabular-nums text-primary">
                      {formatTime(b.preferredAt)}
                    </span>
                    <div>
                      <p className="font-semibold">{b.serviceName}</p>
                      <p className="text-sm text-muted-foreground">{b.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{b.reference}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
