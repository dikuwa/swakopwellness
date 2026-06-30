import { requirePermission } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { getUpcomingCalendarBookings } from "@/dashboard/data";

export const dynamic = "force-dynamic";

export default async function DashboardCalendarPage() {
  await requirePermission("bookings:view");
  const bookings = await getUpcomingCalendarBookings();

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
        <DashboardNav />
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Calendar</h1>
        <p className="mt-3 text-sm text-muted-foreground">Operational calendar view for booking requests and confirmed appointments. Live slot locking remains deferred.</p>
        <div className="mt-6 space-y-3">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{booking.serviceName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{booking.clientName}, {booking.reference}</p>
                </div>
                <p className="text-sm font-medium text-primary">{booking.preferredAt.toLocaleString("en-NA")}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
