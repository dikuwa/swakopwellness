"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pagination } from "@/ui/pagination";
import { Badge, Card, LinkButton } from "@/ui/components";
import { Calendar as CalendarIcon } from "lucide-react";
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

interface BookingsClientViewProps {
  initialBookings: Booking[];
  totalPages: number;
  page: number;
}

export function BookingsClientView({ initialBookings, totalPages, page }: BookingsClientViewProps) {
  const router = useRouter();

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
      <Card className="hidden md:block mt-6">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Reference & Client</th>
              <th className="px-5 py-3 font-medium">Service</th>
              <th className="px-5 py-3 font-medium">Preferred</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {initialBookings.map((booking) => {
              const badge = bookingBadge(booking.status);
              return (
                <tr
                  key={booking.id}
                  className="border-b border-border transition-colors last:border-none hover:bg-surface-muted/50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/bookings/${booking.id}`}
                      className="font-semibold hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {booking.reference}
                    </Link>
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
            <Card
              key={booking.id}
              className="p-4 cursor-pointer"
              onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <Link
                    href={`/dashboard/bookings/${booking.id}`}
                    className="font-semibold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {booking.reference}
                  </Link>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{booking.source.replaceAll("_", " ")}</p>
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
            </Card>
          );
        })}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/bookings" />
    </>
  );
}
