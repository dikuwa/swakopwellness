import Link from "next/link";
import type { Metadata } from "next";
import { Fragment, type ComponentType } from "react";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import {
  CalendarDays,
  CalendarCheck,
  AlertCircle,
  Inbox,
  User,
  Clock,
} from "lucide-react";
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

function getStatusDotColor(status: string): string {
  const map: Record<string, string> = {
    new_request: "bg-warning",
    requires_review: "bg-destructive",
    confirmed: "bg-success",
    completed: "bg-primary",
    cancelled: "bg-muted-foreground/60",
    contacting_client: "bg-warning",
    awaiting_client_response: "bg-warning",
    rescheduled: "bg-primary",
    no_show: "bg-destructive",
  };
  return map[status] ?? "bg-muted-foreground/60";
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

// Fixed timezone issues by parsing correctly
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
  serviceDurationMinutes: number | null;
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

function CompactStat({
  label,
  value,
  icon: Icon,
  className,
  valueClassName,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-xl border border-border bg-surface p-3 transition-colors ${className || ""}`}>
      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground/80" />
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <span className={`text-base font-semibold tracking-tight ${valueClassName || "text-foreground"}`}>{value}</span>
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
      serviceDurationMinutes: bookings.serviceDurationMinutes,
    })
    .from(bookings)
    .leftJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(gte(bookings.preferredAt, fromDate), lte(bookings.preferredAt, toDate)))
    .orderBy(asc(bookings.preferredAt))
    .limit(200);

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
        <CompactStat label="Total Appointments" value={totalAppointments} icon={CalendarDays} />
        <CompactStat label="Confirmed" value={confirmedCount} icon={CalendarCheck} valueClassName="text-success" />
        <CompactStat label="Requires Review" value={reviewCount} icon={AlertCircle} valueClassName="text-destructive" />
        <CompactStat label="New Requests" value={newRequestCount} icon={Inbox} valueClassName="text-warning" />
      </div>

      <Card className="mt-6 overflow-hidden">
        {grouped.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <p>No appointments found for this period.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs text-muted-foreground bg-surface-muted/20">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Time</th>
                    <th className="px-5 py-2.5 font-medium">Service</th>
                    <th className="px-5 py-2.5 font-medium">Client</th>
                    <th className="px-5 py-2.5 font-medium">Booking ID</th>
                    <th className="px-5 py-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map(([dateKey, dateBookings]) => (
                    <Fragment key={dateKey}>
                      <tr className="border-b border-border bg-surface-muted/60">
                        <td colSpan={5} className="px-5 py-2 text-sm font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground/80" />
                            <span>{formatDateHeader(new Date(dateKey + "T12:00:00"))}</span>
                          </div>
                        </td>
                      </tr>
                      {dateBookings.map((b) => {
                        const badge = bookingBadge(b.status);
                        const dotColor = getStatusDotColor(b.status);
                        return (
                          <tr key={b.id} className="border-b border-border transition-colors last:border-none hover:bg-surface-muted/30">
                            <td className="px-5 py-2 font-medium text-primary whitespace-nowrap align-middle">
                              {formatTime(b.preferredAt)}
                            </td>
                            <td className="px-5 py-2 align-middle">
                              <div className="flex flex-col">
                                <Link href={`/dashboard/bookings/${b.id}`} className="font-medium text-foreground hover:underline">
                                  {b.serviceName}
                                </Link>
                                {b.serviceDurationMinutes && (
                                  <span className="text-xs text-muted-foreground/80 font-normal mt-0.5 flex items-center gap-1">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    {b.serviceDurationMinutes} min
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-2 text-muted-foreground align-middle">
                              <div className="flex items-center gap-1.5 font-normal">
                                <User className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                <span className="truncate max-w-[150px]">{b.clientName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-2 font-mono text-xs text-muted-foreground align-middle">
                              {b.reference}
                            </td>
                            <td className="px-5 py-2 text-right align-middle">
                              <Badge variant={badge.variant} className="gap-1.5 inline-flex items-center">
                                <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                                {badge.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="divide-y divide-border md:hidden">
              {grouped.map(([dateKey, dateBookings]) => (
                <div key={dateKey} className="first:pt-0">
                  <div className="bg-surface-muted/60 px-4 py-2 border-b border-border">
                    <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground/80" />
                      <span>{formatDateHeader(new Date(dateKey + "T12:00:00"))}</span>
                    </h2>
                  </div>
                  <div className="divide-y divide-border/60">
                    {dateBookings.map((b) => {
                      const badge = bookingBadge(b.status);
                      const dotColor = getStatusDotColor(b.status);
                      return (
                        <Link key={b.id} href={`/dashboard/bookings/${b.id}`} className="block px-4 py-3 transition-colors hover:bg-surface-muted/30">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-0.5">
                              <p className="font-medium text-foreground">{b.serviceName}</p>
                              {b.serviceDurationMinutes && (
                                <p className="text-xs text-muted-foreground/80 font-normal flex items-center gap-1">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  {b.serviceDurationMinutes} min
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5 pt-1">
                                <User className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                <span>{b.clientName}</span>
                              </p>
                            </div>
                            <Badge variant={badge.variant} className="gap-1.5 inline-flex items-center shrink-0">
                              <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                              {badge.label}
                            </Badge>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-medium text-primary">{formatTime(b.preferredAt)}</span>
                            <span className="font-mono">{b.reference}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </DashboardShell>
  );
}