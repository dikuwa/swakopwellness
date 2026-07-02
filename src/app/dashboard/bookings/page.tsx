import Link from "next/link";
import { requirePermission } from "@/auth/session";
import { DashboardLayout } from "@/dashboard/components";
import { getDashboardBookings } from "@/dashboard/data";
import { confirmBooking, cancelBooking, markCompleted, markNoShow, changeBookingStatus } from "@/booking/actions";
import { getAvailableActions } from "@/booking/status";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

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

const actionLabels: Record<string, string> = {
  requires_review: "Review",
  contacting_client: "Contact",
  awaiting_client_response: "Await",
  confirmed: "Confirm",
  rescheduled: "Reschedule",
  cancelled: "Cancel",
  completed: "Complete",
  no_show: "No-show",
};

function ActionForm({ bookingId, action }: { bookingId: string; action: string }) {
  if (action === "cancelled") {
    return (
      <form action={cancelBooking} className="flex items-center gap-1">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input
          type="text"
          name="reason"
          placeholder="Reason*"
          required
          className="w-20 rounded border border-border px-1.5 py-1 text-xs"
        />
        <button
          type="submit"
          className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-[oklch(0.55_0.20_36)] hover:bg-surface-muted"
        >
          Cancel
        </button>
      </form>
    );
  }

  if (action === "confirmed") {
    return (
      <form action={confirmBooking.bind(null, bookingId)}>
        <button
          type="submit"
          className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-[oklch(0.49_0.16_158)] hover:bg-surface-muted"
        >
          Confirm
        </button>
      </form>
    );
  }

  if (action === "completed") {
    return (
      <form action={markCompleted.bind(null, bookingId)}>
        <button
          type="submit"
          className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-[oklch(0.45_0.12_220)] hover:bg-surface-muted"
        >
          Complete
        </button>
      </form>
    );
  }

  if (action === "no_show") {
    return (
      <form action={markNoShow.bind(null, bookingId)}>
        <button
          type="submit"
          className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-[oklch(0.55_0.20_36)] hover:bg-surface-muted"
        >
          No-show
        </button>
      </form>
    );
  }

  return (
    <form action={changeBookingStatus}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="newStatus" value={action} />
      <button
        type="submit"
        className="rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-surface-muted"
      >
        {actionLabels[action] ?? action.replaceAll("_", " ")}
      </button>
    </form>
  );
}

function ActionsCell({ bookingId, status }: { bookingId: string; status: string }) {
  const actions = getAvailableActions(status);
  if (actions.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((action) => (
        <ActionForm key={action} bookingId={bookingId} action={action} />
      ))}
    </div>
  );
}

export default async function DashboardBookingsPage() {
  await requirePermission("bookings:view");
  const bookings = await getDashboardBookings();

  return (
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
          <h1 className="mt-2 text-2xl sm:text-3xl tracking-[-0.03em]">Bookings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review requests, update statuses and add manual bookings.</p>
        </div>
        <Link href="/dashboard/bookings/new" className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90">
          Add manual booking
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-3">Reference</th>
              <th>Client</th>
              <th>Service</th>
              <th>Preferred</th>
              <th>Status</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-border">
                <td className="whitespace-nowrap py-3 font-medium">
                  <Link href={`/dashboard/bookings/${booking.id}`} className="hover:text-primary">{booking.reference}</Link>
                </td>
                <td className="whitespace-nowrap">{booking.clientName}</td>
                <td className="whitespace-nowrap">{booking.serviceName}</td>
                <td className="whitespace-nowrap">{booking.preferredAt.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                <td className="whitespace-nowrap">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="whitespace-nowrap capitalize">{booking.source.replaceAll("_", " ")}</td>
                <td className="py-3">
                  <ActionsCell bookingId={booking.id} status={booking.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
