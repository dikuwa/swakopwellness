import { requirePermission } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { getDashboardBookings } from "@/dashboard/data";

export const dynamic = "force-dynamic";

export default async function DashboardBookingsPage() {
  await requirePermission("bookings:view");
  const bookings = await getDashboardBookings();

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-6xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
        <DashboardNav />
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Bookings</h1>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground"><tr><th className="py-3">Reference</th><th>Client</th><th>Service</th><th>Preferred</th><th>Status</th><th>Source</th></tr></thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-t border-border">
                  <td className="py-3 font-medium">{booking.reference}</td>
                  <td>{booking.clientName}</td>
                  <td>{booking.serviceName}</td>
                  <td>{booking.preferredAt.toLocaleString("en-NA")}</td>
                  <td>{booking.status.replaceAll("_", " ")}</td>
                  <td>{booking.source.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
