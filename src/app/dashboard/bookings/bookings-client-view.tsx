"use client";

import Link from "next/link";
import { useState } from "react";
import { useTransition, useRouter } from "react";
import { confirmBooking, markCompleted, changeBookingStatus, cancelBooking, markNoShow } from "@/booking/actions";
import { getAvailableActions } from "@/booking/status";
import { Pagination } from "@/ui/pagination";
import { Badge, Button, Card, LinkButton } from "@/ui/components";
import { ActionDropdown } from "@/ui/dropdown";
import { MoreHorizontal, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { RescheduleBookingModal } from "./reschedule-modal";
import { ActionReasonModal } from "./action-reason-modal";
import toast from "react-hot-toast";
import type { getDashboardBookings } from "@/dashboard/data";

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

function ActionButton({ action, booking, onReschedule, onOpenReasonModal, onSuccess }: { action: string, booking: Booking, onReschedule: () => void, onOpenReasonModal: (action: string) => void, onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  
  const actionLabels: Record<string, string> = {
    confirm: "Confirm",
    review: "Review",
    contacting_client: "Contacting Client",
    reschedule: "Reschedule",
    complete: "Complete",
    cancel: "Cancel",
    no_show: "No-show",
  };

  const handleAction = () => {
    startTransition(async () => {
      try {
        switch(action) {
          case 'confirm':
            await confirmBooking(booking.id);
            break;
          case 'complete':
            await markCompleted(booking.id);
            break;
          case 'contacting_client':
          case 'review':
            const formData = new FormData();
            formData.append('bookingId', booking.id);
            formData.append('newStatus', action);
            await changeBookingStatus(formData);
            break;
        }
        toast.success("Booking updated");
        onSuccess();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "An unknown error occurred.");
      }
    });
  };

  if (action === 'reschedule') {
    return <button type="button" onClick={onReschedule} className="w-full text-left text-sm p-2 rounded-lg hover:bg-surface-muted">Reschedule</button>
  }

  if (action === 'cancel' || action === 'no_show') {
    return <button type="button" onClick={() => onOpenReasonModal(action)} className="w-full text-left text-sm p-2 rounded-lg hover:bg-surface-muted">{actionLabels[action]}</button>
  }

  return (
    <button onClick={handleAction} disabled={isPending} className="w-full text-left text-sm p-2 rounded-lg hover:bg-surface-muted flex items-center">
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {actionLabels[action] ?? action.replaceAll("_", " ")}
    </button>
  );
}

function ActionsCell({ booking, onReschedule, onOpenReasonModal, onSuccess }: { booking: Booking, onReschedule: () => void, onOpenReasonModal: (action: string) => void, onSuccess: () => void }) {
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
            <ActionButton key={action} action={action} booking={booking} onReschedule={onReschedule} onOpenReasonModal={onOpenReasonModal} onSuccess={onSuccess} />
          ))}
        </ActionDropdown>
      )}
    </div>
  );
}

interface BookingsClientViewProps {
  initialBookings: Booking[];
  totalPages: number;
  page: number;
}

export function BookingsClientView({ initialBookings, totalPages, page }: BookingsClientViewProps) {
  const router = useRouter();
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [reasonModal, setReasonModal] = useState<{booking: Booking, action: string} | null>(null);

  const handleSuccess = () => {
    router.refresh();
  };

  const reasonActions: Record<string, (formData: FormData) => Promise<void>> = {
    cancel: cancelBooking,
    no_show: markNoShow,
  };

  if (initialBookings.length === 0) {
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
      <RescheduleBookingModal key={rescheduleBooking?.id} booking={rescheduleBooking} isOpen={!!rescheduleBooking} onClose={() => setRescheduleBooking(null)} onSuccess={handleSuccess} />
      <ActionReasonModal 
        key={reasonModal?.booking.id}
        booking={reasonModal?.booking ?? null}
        action={reasonModal?.action ?? ""}
        isOpen={!!reasonModal}
        onClose={() => setReasonModal(null)}
        formAction={reasonActions[reasonModal?.action ?? ""]}
        onSuccess={handleSuccess}
      />
      
      <Card className="hidden md:block mt-6">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Reference & Client</th>
              <th className="px-5 py-3 font-medium">Service</th>
              <th className="px-5 py-3 font-medium">Preferred</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Source</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialBookings.map((booking) => {
              const badge = bookingBadge(booking.status);
              return (
                <tr key={booking.id} className="border-b border-border transition-colors last:border-none hover:bg-surface-muted/50">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/bookings/${booking.id}`} className="font-semibold hover:underline">{booking.reference}</Link>
                    <p className="text-muted-foreground">{booking.clientName}</p>
                  </td>
                  <td className="px-5 py-3">{booking.serviceName}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon size={14} />
                      <span>
                        {booking.preferredAt.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="px-5 py-3 capitalize">{booking.source.replaceAll("_", " ")}</td>
                  <td className="px-5 py-3">
                    <ActionsCell booking={booking} onReschedule={() => setRescheduleBooking(booking)} onOpenReasonModal={(action) => setReasonModal({booking, action})} onSuccess={handleSuccess} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-4 md:hidden mt-6">
        {initialBookings.map((booking) => {
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
                  <CalendarIcon size={14} />
                  <span className="text-muted-foreground">
                    {booking.preferredAt.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <ActionsCell booking={booking} onReschedule={() => setRescheduleBooking(booking)} onOpenReasonModal={(action) => setReasonModal({booking, action})} onSuccess={handleSuccess} />
              </div>
            </Card>
          );
        })}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/bookings" />
    </>
  );
}
