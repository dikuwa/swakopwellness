import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requirePermission, hasPermission } from "@/auth/session";
import { getAvailableActions } from "@/booking/status";
import { DashboardShell } from "@/dashboard/shell";
import { getBookableServicesForManualUse, getDashboardBookingById } from "@/dashboard/data";
import { formatBusinessDateTime } from "@/lib/business-time";
import { StatusActionsPanel } from "../status-actions-panel";
import { BookingDetailsForm } from "../booking-details-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Booking ${id.slice(0, 8)} — Dashboard` };
}

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
  const [booking, services] = await Promise.all([
    getDashboardBookingById(id, canViewSuitability),
    getBookableServicesForManualUse(),
  ]);

  if (!booking) notFound();

  const actions = getAvailableActions(booking.status);

  return (
    <DashboardShell>
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
          <DetailItem label="Preferred time" value={formatBusinessDateTime(booking.preferredAt)} />
          <DetailItem label="Alternative time" value={booking.alternativeAt ? formatBusinessDateTime(booking.alternativeAt) : "None provided"} />
          <DetailItem label="Service price" value={`N$${(booking.servicePriceCents / 100).toFixed(2)}`} />
          <DetailItem label="Duration" value={booking.serviceDurationMinutes ? `${booking.serviceDurationMinutes} minutes` : "Not set"} />
          <DetailItem label="Source" value={<span className="capitalize">{booking.source.replaceAll("_", " ")}</span>} />
          <DetailItem label="Client type" value={<span className="capitalize">{booking.clientType}</span>} />
          <DetailItem label="Preferred contact" value={<span className="capitalize">{booking.preferredContactMethod}</span>} />
          <DetailItem label="Created" value={booking.createdAt.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} />
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
            <StatusActionsPanel
              bookingId={booking.id}
              currentStatus={booking.status}
              currentDate={booking.preferredAt}
              availableActions={actions}
            />
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-background p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Booking Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Update the appointment time, service assignment, contact preference, and internal notes.</p>
          </div>
          <BookingDetailsForm booking={booking} services={services} />
        </section>

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
                  <p className="mt-1 text-muted-foreground">{entry.createdAt.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} by {entry.actorName ?? "System"}</p>
                  {entry.note ? <p className="mt-2 text-muted-foreground">{entry.note}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </div>
    </DashboardShell>
  );
}
