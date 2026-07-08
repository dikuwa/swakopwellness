import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { hasPermission } from "@/auth/permissions";
import { DashboardShell } from "@/dashboard/shell";
import { getClientById } from "@/dashboard/data";
import { getDb } from "@/db/client";
import { bookings, invoices, payments } from "@/db/schema";
import { CalendarCheck, FileText, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Client ${id.slice(0, 8)} — Dashboard` };
}

function bookingBadge(status: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    new_request: { label: "New", cls: "bg-blue-100 text-blue-700" },
    requires_review: { label: "Review", cls: "bg-amber-100 text-amber-700" },
    confirmed: { label: "Confirmed", cls: "bg-green-100 text-green-700" },
    completed: { label: "Completed", cls: "bg-gray-100 text-gray-700" },
    cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
    no_show: { label: "No-show", cls: "bg-gray-100 text-gray-500" },
    contacting_client: { label: "Contacting", cls: "bg-purple-100 text-purple-700" },
    awaiting_client_response: { label: "Awaiting", cls: "bg-orange-100 text-orange-700" },
    rescheduled: { label: "Rescheduled", cls: "bg-yellow-100 text-yellow-700" },
  };
  return map[status] ?? { label: status.replaceAll("_", " "), cls: "bg-gray-100 text-gray-700" };
}

function invoiceBadge(status: string): { label: string; cls: string } {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    issued: "bg-blue-100 text-blue-700",
    partially_paid: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    voided: "bg-gray-100 text-gray-400",
  };
  return {
    label: status.replaceAll("_", " "),
    cls: map[status] ?? "bg-gray-100 text-gray-700",
  };
}

export default async function DashboardClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("clients:view");
  const { id } = await props.params;
  const client = await getClientById(id);
  const canCreateBooking = hasPermission(user.permissions, "bookings:create");
  const canCreateDocument = hasPermission(user.permissions, "documents:create");
  const canRecordPayment = hasPermission(user.permissions, "payments:record");
  const canViewFinancials = hasPermission(user.permissions, "financials:view");

  if (!client) {
    return (
      <DashboardShell>
        <p className="text-muted-foreground">Client not found.</p>
        <Link href="/dashboard/clients" className="mt-4 inline-block rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-surface-muted">
          ← Back to Clients
        </Link>
      </DashboardShell>
    );
  }

  const db = getDb();

  const [clientBookings, clientInvoices, clientPayments] = await Promise.all([
    db.select().from(bookings).where(eq(bookings.clientId, id)).orderBy(bookings.preferredAt),
    canViewFinancials ? db.select().from(invoices).where(eq(invoices.clientId, id)).orderBy(invoices.issueDate) : [],
    canViewFinancials ? db.select().from(payments).where(eq(payments.clientId, id)).orderBy(payments.paymentDate) : [],
  ]);

  return (
    <DashboardShell>
      <Link href="/dashboard/clients" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">&larr; Clients</Link>
      <h1 className="text-3xl font-semibold tracking-[-0.035em]">{client.fullName}</h1>

      {/* Action bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {canCreateBooking && (
          <Link
            href={`/dashboard/bookings/new`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            New Booking
          </Link>
        )}
        {canCreateDocument && (
          <>
            <Link
              href="/dashboard/documents?type=quotation"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              New Document
            </Link>
          </>
        )}
        {canRecordPayment && (
          <Link
            href={`/dashboard/payments/new?client_id=${id}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Record Payment
          </Link>
        )}
      </div>

      {/* Client Details */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</p>
          <p className="mt-1 font-medium">{client.phone ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</p>
          <p className="mt-1 font-medium">{client.email ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp</p>
          <p className="mt-1 font-medium">{client.whatsappNumber ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferred Contact</p>
          <p className="mt-1 font-medium capitalize">{client.preferredContactMethod.replaceAll("_", " ")}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Booking</p>
          <p className="mt-1 font-medium">{client.lastBookingAt ? client.lastBookingAt.toLocaleDateString("en-GB") : "—"}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client Since</p>
          <p className="mt-1 font-medium">{client.createdAt.toLocaleDateString("en-GB")}</p>
        </div>
      </section>

      {/* Bookings */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-[-0.025em]">Bookings ({clientBookings.length})</h2>
        {clientBookings.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-3">Reference</th>
                  <th>Service</th>
                  <th>Preferred</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {clientBookings.map((b) => {
                  const badge = bookingBadge(b.status);
                  return (
                    <tr key={b.id} className="border-t border-border hover:bg-surface-muted/50">
                      <td className="py-3">
                        <Link href={`/dashboard/bookings/${b.id}`} className="font-medium hover:text-primary">
                          {b.reference}
                        </Link>
                      </td>
                      <td>{b.serviceName}</td>
                      <td className="whitespace-nowrap">{b.preferredAt.toLocaleDateString("en-GB")}</td>
                      <td>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="capitalize">{b.source.replaceAll("_", " ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-muted-foreground">No bookings found.</p>
        )}
      </section>

      {canViewFinancials && (
        <>
          {/* Invoices */}
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-[-0.025em]">Invoices ({clientInvoices.length})</h2>
            {clientInvoices.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="py-3">Number</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientInvoices.map((inv) => {
                      const badge = invoiceBadge(inv.status);
                      return (
                        <tr key={inv.id} className="border-t border-border hover:bg-surface-muted/50">
                          <td className="py-3">
                            <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium hover:text-primary">
                              {inv.invoiceNumber}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap">{inv.issueDate.toLocaleDateString("en-GB")}</td>
                          <td className="whitespace-nowrap">{inv.dueDate.toLocaleDateString("en-GB")}</td>
                          <td className="font-medium">N${(inv.totalCents / 100).toFixed(2)}</td>
                          <td>N${(inv.amountPaidCents / 100).toFixed(2)}</td>
                          <td className="font-semibold">N${(inv.balanceCents / 100).toFixed(2)}</td>
                          <td>
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">No invoices found.</p>
            )}
          </section>

          {/* Payments */}
          <section className="mt-10">
            <h2 className="text-xl font-semibold tracking-[-0.025em]">Payments ({clientPayments.length})</h2>
            {clientPayments.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="py-3">Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPayments.map((p) => (
                      <tr key={p.id} className="border-t border-border hover:bg-surface-muted/50">
                        <td className="py-3 font-medium">
                          <Link href={`/dashboard/payments/${p.id}`} className="hover:text-primary">
                            {p.paymentDate.toLocaleDateString("en-GB")}
                          </Link>
                        </td>
                        <td>N${(p.amountCents / 100).toFixed(2)}</td>
                        <td className="capitalize">{p.method.replaceAll("_", " ")}</td>
                        <td>{p.reference ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">No payments found.</p>
            )}
          </section>
        </>
      )}
    </DashboardShell>
  );
}
