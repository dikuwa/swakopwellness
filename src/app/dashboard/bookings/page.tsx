"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardShell } from "@/dashboard/shell";
import { getDashboardBookings } from "@/dashboard/data";
import { confirmBooking, markCompleted, markNoShow, changeBookingStatus } from "@/booking/actions";
import { getAvailableActions } from "@/booking/status";
import { Pagination } from "@/ui/pagination";
import { SearchInput } from "@/ui/search-input";
import { Badge, Button, Card, LinkButton } from "@/ui/components";
import { ActionDropdown } from "@/ui/dropdown";
import { MoreHorizontal, Calendar as CalendarIcon } from "lucide-react";
import { RescheduleBookingModal } from "./reschedule-modal";

type Booking = Awaited<ReturnType<typeof getDashboardBookings>>["rows"][0];

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

function ActionButton({ action, bookingId, onReschedule }: { action: string, bookingId: string, onReschedule: () => void }) {
  const actionLabels: Record<string, string> = {
    confirm: "Confirm",
    review: "Review",
    contact: "Contact",
    reschedule: "Reschedule",
    complete: "Complete",
    cancel: "Cancel",
    no_show: "No-show",
  };

  if (action === 'reschedule') {
    return <button type="button" onClick={onReschedule} className="w-full text-left text-sm p-2 rounded-lg hover:bg-surface-muted">Reschedule</button>
  }

  // For now, 'cancel' will be a simple status change. Phase 5 will add a modal for the reason.
  if (action === 'cancel') {
    return (
      <form action={changeBookingStatus}>
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="newStatus" value="cancelled" />
        <button type="submit" className="w-full text-left text-sm p-2 rounded-lg hover:bg-surface-muted">Cancel</button>
      </form>
    );
  }

  if (action === 'confirm') {
    return (
      <form action={confirmBooking.bind(null, bookingId)}>
        <button type="submit" className="w-full text-left text-sm p-2 rounded-lg hover:bg-surface-muted">Confirm</button>
      </form>
    );
  }

  if (action === 'complete') {
    return (
      <form action={markCompleted.bind(null, bookingId)}>
        <button type="submit" className="w-full text-left text-sm p-2 rounded-lg hover:bg-surface-muted">Complete</button>
      </form>
    );
  }

  if (action === 'no_show') {
    return (
      <form action={markNoShow.bind(null, bookingId)}>
        <button type="submit" className="w-full text-left text-sm p-2 rounded-lg hover:bg-surface-muted">No-show</button>
      </form>
    );
  }
  
  // Fallback for other status changes like 'review', 'contacting_client', etc.
  return (
    <form action={changeBookingStatus}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="newStatus" value={action} />
      <button type="submit" className="w-full text-left text-sm p-2 rounded-lg hover:bg-surface-muted">{actionLabels[action] ?? action.replaceAll("_", " ")}</button>
    </form>
  );
}

function ActionsCell({ booking, onReschedule }: { booking: Booking, onReschedule: () => void }) {
  const allActions = getAvailableActions(booking.status);
  
  const primaryActionMap: Record<string, string | undefined> = {
    new_request: "review",
    requires_review: "contacting_client",
    confirmed: "reschedule",
  };

  const primaryAction = primaryActionMap[booking.status];
  const primaryActionExists = primaryAction && allActions.includes(primaryAction);

  const secondaryActions = allActions.filter(a => a !== primaryAction);

  if (allActions.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {primaryActionExists && (
        <Button variant="secondary" size="sm" onClick={primaryAction === 'reschedule' ? onReschedule : undefined}>
          {primaryAction.replaceAll("_", " ")}
        </Button>
      )}
      {secondaryActions.length > 0 && (
        <ActionDropdown
          trigger={
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <MoreHorizontal size={16} />
            </Button>
          }
        >
          {secondaryActions.map((action) => (
            <ActionButton key={action} action={action} bookingId={booking.id} onReschedule={onReschedule} />
          ))}
        </ActionDropdown>
      )}
    </div>
  );
}

function BookingsList({ bookings, page, totalPages }: { bookings: Booking[], page: number, totalPages: number }) {
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold">No bookings found</h3>
        <p className="text-sm text-muted-foreground mt-1">Get started by creating a new booking.</p>
        <LinkButton href="/dashboard/bookings/new" className="mt-4">New Booking</LinkButton>
      </div>
    );
  }

  return (
    <>
      <RescheduleBookingModal key={rescheduleBooking?.id} booking={rescheduleBooking} isOpen={!!rescheduleBooking} onClose={() => setRescheduleBooking(null)} />
      
      {/* Desktop Table */}
      <Card className="hidden md:block mt-6">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Booking</th>
              <th className="px-5 py-3 font-medium">Client & Service</th>
              <th className="px-5 py-3 font-medium">Date & Time</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const badge = bookingBadge(booking.status);
              return (
                <tr key={booking.id} className="border-b border-border transition-colors last:border-none hover:bg-surface-muted/50">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/bookings/${booking.id}`} className="font-semibold hover:underline">{booking.reference}</Link>
                    <p className="text-xs text-muted-foreground capitalize">{booking.source.replaceAll("_", " ")}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-semibold">{booking.clientName}</p>
                    <p className="text-xs text-muted-foreground">{booking.serviceName}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {booking.preferredAt.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <ActionsCell booking={booking} onReschedule={() => setRescheduleBooking(booking)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden mt-6">
        {bookings.map((booking) => {
          const badge = bookingBadge(booking.status);
          return (
            <Card key={booking.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/dashboard/bookings/${booking.id}`} className="font-semibold hover:underline">{booking.reference}</Link>
                  <p className="text-xs text-muted-foreground capitalize">{booking.source.replaceAll("_", " ")}</p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p><strong className="font-medium">Client:</strong> {booking.clientName}</p>
                <p><strong className="font-medium">Service:</strong> {booking.serviceName}</p>
                <div className="flex items-center gap-2">
                  <CalendarIcon size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {booking.preferredAt.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <ActionsCell booking={booking} onReschedule={() => setRescheduleBooking(booking)} />
              </div>
            </Card>
          );
        })}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/bookings" />
    </>
  );
}

function BookingsPageContent() {
  const searchParams = useSearchParams();
  const pageStr = searchParams.get("page");
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardBookings(page, 25, q ?? undefined).then(({ rows, total }) => {
      setBookings(rows);
      setTotalPages(Math.ceil(total / 25));
      setLoading(false);
    });
  }, [page, q]);

  if (loading) {
    return <div className="mt-6"><div className="w-full h-64 animate-pulse rounded-2xl bg-surface-muted" /></div>;
  }

  return <BookingsList bookings={bookings} page={page} totalPages={totalPages} />;
}


export default function DashboardBookingsPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
          <h1 className="mt-2 text-2xl sm:text-3xl tracking-[-0.03em]">Bookings</h1>
          <p className="text-sm text-muted-foreground">Review requests, update statuses and add manual bookings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-64">
            <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-xl bg-surface-muted" />}>
              <SearchInput placeholder="Search by client, ref, service..." />
            </Suspense>
          </div>
          <Link href="/dashboard/bookings/new" className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90">
            New Booking
          </Link>
        </div>
      </div>
      <Suspense fallback={<div className="mt-6"><div className="w-full h-64 animate-pulse rounded-2xl bg-surface-muted" /></div>}>
        <BookingsPageContent />
      </Suspense>
    </DashboardShell>
  );
}

