import Link from "next/link";
import type { Metadata } from "next";
import { and, count, desc, eq, isNull, or } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDb } from "@/db/client";
import { payments, clients, invoices, bookings, users } from "@/db/schema";
import { Pagination } from "@/ui/pagination";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payments — Swakop Wellness Centre",
};

export default async function PaymentsPage(props: { searchParams: Promise<{ page?: string }> }) {
  await requirePermission("financials:view");
  const db = getDb();

  const searchParams = await props.searchParams;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  const [allPayments, [{ count: total }]] = await Promise.all([
    db
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
        voidedAt: payments.voidedAt,
        createdAt: payments.createdAt,
        clientName: clients.fullName,
        invoiceNumber: invoices.invoiceNumber,
        bookingRef: bookings.reference,
        recordedByName: users.name,
      })
      .from(payments)
      .leftJoin(clients, eq(payments.clientId, clients.id))
      .leftJoin(
        invoices,
        and(
          eq(payments.invoiceId, invoices.id),
          or(isNull(payments.bookingId), isNull(invoices.bookingId), eq(payments.bookingId, invoices.bookingId)),
        ),
      )
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .leftJoin(users, eq(payments.recordedByUserId, users.id))
      .orderBy(desc(payments.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(payments),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Payments</h1>
      </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-3">Date</th>
                <th>Client</th>
                <th>Invoice</th>
                <th>Booking Ref</th>
                <th>Amount</th>
                <th>Status</th>
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
                      {p.paymentDate.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
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
                  <td className="whitespace-nowrap">
                    {p.voidedAt ? (
                      <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">Voided</span>
                    ) : (
                      <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">Recorded</span>
                    )}
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
                  <td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/payments" />
    </DashboardShell>
  );
}
