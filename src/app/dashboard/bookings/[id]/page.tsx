import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requirePermission } from "@/auth/session";
import { hasPermission } from "@/auth/permissions";
import { cancelBooking, changeBookingStatus, confirmBooking, markCompleted, markNoShow } from "@/booking/actions";
import { getAvailableActions } from "@/booking/status";
import { DashboardLayout } from "@/dashboard/components";
import { logoutAction } from "../../actions";
import { getDashboardBookingById } from "@/dashboard/data";

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
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>{status.replaceAll("_", " ")}</span>;
}

const actionLabels: Record<string, string> = {
  requires_review: "Review",
  contacting_client: "Contacting client",
  awaiting_client_response: "Awaiting response",
  confirmed: "Confirm",
  rescheduled: "Reschedule",
  cancelled: "Cancel",
  completed: "Complete",
  no_show: "No-show",
};

function ActionForm({ bookingId, action }: { bookingId: string; action: string }) {
  if (action === "cancelled") {
    return (
      <form action={async (fd) => { "use server"; await cancelBooking(fd); }} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input name="reason" required placeholder="Reason" className="h-10 rounded-xl border border-border bg-background px-3 text-sm" />
        <button type="submit" className="h-10 rounded-xl border border-destructive/30 px-3 text-sm font-semibold text-destructive hover:bg-destructive/10">Cancel</button>
      </form>
    );
  }

  if (action === "confirmed") {
    return <form action={async () => { "use server"; await confirmBooking(bookingId); }}><button type="submit" className="h-10 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-surface-muted">Confirm</button></form>;
  }

  if (action === "completed") {
    return <form action={async () => { "use server"; await markCompleted(bookingId); }}><button type="submit" className="h-10 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-surface-muted">Complete</button></form>;
  }

  if (action === "no_show") {
    return <form action={async () => { "use server"; await markNoShow(bookingId); }}><button type="submit" className="h-10 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-surface-muted">No-show</button></form>;
  }

  return (
    <form action={async (fd) => { "use server"; await changeBookingStatus(fd); }}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="newStatus" value={action} />
      <button type="submit" className="h-10 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-surface-muted">{actionLabels[action] ?? action.replaceAll("_", " ")}</button>
    </form>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

export default async function BookingDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("bookings:view");
  const { id } = await props.params;
  const canViewSuitability = hasPermission(user.permissions, "suitability:view");
  const booking = await getDashboardBookingById(id, canViewSuitability);

  if (!booking) notFound();

  const actions = getAvailableActions(booking.status);

  return (
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
      <Link href="/dashboard/bookings" className="text-sm text-muted-foreground hover:text-foreground">&larr; Bookings</Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">{booking.reference}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">{booking.clientName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{booking.serviceName}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Preferred time" value={booking.preferredAt.toLocaleString("en-NA")} />
          <DetailItem label="Alternative time" value={booking.alternativeAt ? booking.alternativeAt.toLocaleString("en-NA") : "None provided"} />
          <DetailItem label="Service price" value={`N$${(booking.servicePriceCents / 100).toFixed(2)}`} />
          <DetailItem label="Duration" value={booking.serviceDurationMinutes ? `${booking.serviceDurationMinutes} minutes` : "Not set"} />
          <DetailItem label="Source" value={<span className="capitalize">{booking.source.replaceAll("_", " ")}</span>} />
          <DetailItem label="Client type" value={<span className="capitalize">{booking.clientType}</span>} />
          <DetailItem label="Preferred contact" value={<span className="capitalize">{booking.preferredContactMethod}</span>} />
          <DetailItem label="Created" value={booking.createdAt.toLocaleString("en-NA")} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-border bg-background p-5">
            <h2 className="text-lg font-semibold">Client Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Phone" value={booking.clientPhone ?? "None"} />
              <DetailItem label="Email" value={booking.clientEmail ?? "None"} />
              <DetailItem label="WhatsApp" value={booking.clientWhatsapp ?? "None"} />
              <DetailItem label="Client record" value={<Link href={`/dashboard/clients/${booking.clientId}`} className="text-primary hover:underline">View client</Link>} />
            </div>
            {booking.note ? <p className="mt-5 whitespace-pre-wrap rounded-xl bg-surface-muted p-4 text-sm text-muted-foreground">{booking.note}</p> : null}
          </section>

          <section className="rounded-2xl border border-border bg-background p-5">
            <h2 className="text-lg font-semibold">Status Actions</h2>
            {actions.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No further status actions are available.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {actions.map((action) => <ActionForm key={action} bookingId={booking.id} action={action} />)}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-border bg-background p-5">
            <h2 className="text-lg font-semibold">Suitability</h2>
            {!canViewSuitability ? (
              <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-muted-foreground">You do not have permission to view suitability responses.</p>
            ) : booking.answers.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No suitability answers stored.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {booking.answers.map((answer) => (
                  <div key={answer.id} className="rounded-xl border border-border p-4 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <p className="font-medium">{answer.questionText}</p>
                      {answer.flagged ? <span className="rounded-full bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">Flagged</span> : null}
                    </div>
                    <p className="mt-2 capitalize text-muted-foreground">Answer: {answer.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-background p-5">
            <h2 className="text-lg font-semibold">Status History</h2>
            {booking.history.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No status history recorded.</p> : null}
            <div className="mt-4 space-y-3">
              {booking.history.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-surface-muted p-4 text-sm">
                  <p className="font-medium capitalize">{entry.fromStatus ? `${entry.fromStatus.replaceAll("_", " ")} -> ` : ""}{entry.toStatus.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-muted-foreground">{entry.createdAt.toLocaleString("en-NA")} by {entry.actorName ?? "System"}</p>
                  {entry.note ? <p className="mt-2 text-muted-foreground">{entry.note}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </div>
    </DashboardLayout>
  );
}
