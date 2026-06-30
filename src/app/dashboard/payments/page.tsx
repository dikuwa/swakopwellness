import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { getDb } from "@/db/client";
import { payments, clients, invoices, bookings, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requirePermission("financials:view");
  const db = getDb();

  const allPayments = await db
    .select({
      id: payments.id,
      clientId: payments.clientId,
      invoiceId: payments.invoiceId,
      bookingId: payments.bookingId,
      amountCents: payments.amountCents,
      paymentDate: payments.paymentDate,
      method: payments.method,
      reference: payments.reference,
      notes: payments.notes,
      createdAt: payments.createdAt,
      clientName: clients.fullName,
      invoiceNumber: invoices.invoiceNumber,
      bookingRef: bookings.reference,
      recordedByName: users.name,
    })
    .from(payments)
    .leftJoin(clients, eq(payments.clientId, clients.id))
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(bookings, eq(payments.bookingId, bookings.id))
    .leftJoin(users, eq(payments.recordedByUserId, users.id))
    .orderBy(desc(payments.createdAt))
    .limit(100);

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-6xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
        <DashboardNav />
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Payments</h1>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-3">Date</th>
                <th>Client</th>
                <th>Invoice</th>
                <th>Booking Ref</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {allPayments.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-surface-muted/50">
                  <td className="whitespace-nowrap py-3">
                    <Link href={`/dashboard/payments/${p.id}`} className="block font-medium hover:text-primary">
                      {p.paymentDate.toLocaleString("en-NA")}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap">
                    {p.clientId ? (
                      <Link href={`/dashboard/clients/${p.clientId}`} className="hover:text-primary">
                        {p.clientName}
                      </Link>
                    ) : (
                      p.clientName ?? "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    {p.invoiceId ? (
                      <Link href={`/dashboard/invoices/${p.invoiceId}`} className="hover:text-primary">
                        {p.invoiceNumber}
                      </Link>
                    ) : (
                      p.invoiceNumber ?? "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap">{p.bookingRef ?? "—"}</td>
                  <td className="whitespace-nowrap font-medium">
                    N${(p.amountCents / 100).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap capitalize">
                    {p.method.replaceAll("_", " ")}
                  </td>
                  <td className="whitespace-nowrap">{p.reference ?? "—"}</td>
                  <td className="whitespace-nowrap">{p.recordedByName ?? "—"}</td>
                </tr>
              ))}
              {allPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
