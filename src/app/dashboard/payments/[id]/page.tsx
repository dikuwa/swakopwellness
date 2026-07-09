import Link from "next/link";
import type { Metadata } from "next";
import { and, eq, isNull, or } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDb } from "@/db/client";
import { payments, clients, invoices, bookings, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment Details — Dashboard",
};

export default async function PaymentDetailPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("financials:view");
  const { id } = await props.params;
  const db = getDb();

  const [payment] = await db
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
      voidReason: payments.voidReason,
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
    .where(eq(payments.id, id))
    .limit(1);

  if (!payment) {
    return (
      <DashboardShell>
        <p className="text-muted-foreground">Payment not found.</p>
        <Link
          href="/dashboard/payments"
          className="mt-4 inline-block rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-surface-muted"
        >
          ← Back to Payments
        </Link>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
        <Link
          href="/dashboard/payments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Payments
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Payment Details</h1>

        {payment.voidedAt && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-semibold">This payment was voided on {payment.voidedAt.toLocaleString("en-GB")}.</p>
            {payment.voidReason ? <p className="mt-1">Reason: {payment.voidReason}</p> : null}
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="mt-1">{payment.paymentDate.toLocaleString("en-GB")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="mt-1">
              {payment.clientId ? (
                <Link href={`/dashboard/clients/${payment.clientId}`} className="font-semibold hover:text-primary">
                  {payment.clientName}
                </Link>
              ) : (
                payment.clientName ?? "—"
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invoice</p>
            <p className="mt-1">
              {payment.invoiceId ? (
                <Link href={`/dashboard/invoices/${payment.invoiceId}`} className="font-semibold hover:text-primary">
                  {payment.invoiceNumber}
                </Link>
              ) : (
                payment.invoiceNumber ?? "—"
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Booking</p>
            <p className="mt-1">
              {payment.bookingId ? (
                <Link href="/dashboard/bookings" className="font-semibold hover:text-primary">
                  {payment.bookingRef}
                </Link>
              ) : (
                payment.bookingRef ?? "—"
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="mt-1 font-semibold">N${(payment.amountCents / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Method</p>
            <p className="mt-1 capitalize">{payment.method.replaceAll("_", " ")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reference</p>
            <p className="mt-1">{payment.reference ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Recorded By</p>
            <p className="mt-1">{payment.recordedByName ?? "—"}</p>
          </div>
        </div>

        {payment.notes && (
          <div className="mt-8">
            <p className="text-sm font-semibold text-muted-foreground">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{payment.notes}</p>
          </div>
        )}

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            Recorded at {payment.createdAt.toLocaleString("en-GB")}
          </p>
        </div>
    </DashboardShell>
  );
}
