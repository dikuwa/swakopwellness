import Link from "next/link";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { DashboardLayout } from "@/dashboard/components";
import { logoutAction } from "../../actions";
import { getClientById } from "@/dashboard/data";
import { getDb } from "@/db/client";
import { bookings, invoices, payments } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function DashboardClientDetailPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("clients:view");
  const { id } = await props.params;
  const client = await getClientById(id);

  if (!client) {
    return (
      <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
        <p className="text-muted-foreground">Client not found.</p>
        <Link href="/dashboard/clients" className="mt-4 inline-block rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-surface-muted">
          ← Back to Clients
        </Link>
      </DashboardLayout>
    );
  }

  const db = getDb();

  const clientBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.clientId, id))
    .orderBy(bookings.preferredAt);

  const clientInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, id))
    .orderBy(invoices.issueDate);

  const clientPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.clientId, id))
    .orderBy(payments.paymentDate);

  return (
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
        <Link href="/dashboard/clients" className="mb-4 inline-block rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-surface-muted">
          ← Back to Clients
        </Link>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">{client.fullName}</h1>

        {/* Client Details */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</span>
            <p className="mt-1">{client.phone ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</span>
            <p className="mt-1">{client.email ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp</span>
            <p className="mt-1">{client.whatsappNumber ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferred Contact</span>
            <p className="mt-1">{client.preferredContactMethod.replaceAll("_", " ")}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Booking</span>
            <p className="mt-1">{client.lastBookingAt ? client.lastBookingAt.toLocaleString("en-NA") : "—"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</span>
            <p className="mt-1">{client.createdAt.toLocaleString("en-NA")}</p>
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
                  {clientBookings.map((b) => (
                    <tr key={b.id} className="border-t border-border">
                      <td className="py-3 font-medium">{b.reference}</td>
                      <td>{b.serviceName}</td>
                      <td>{b.preferredAt.toLocaleString("en-NA")}</td>
                      <td>{b.status.replaceAll("_", " ")}</td>
                      <td>{b.source.replaceAll("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-muted-foreground">No bookings found.</p>
          )}
        </section>

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
                  {clientInvoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-border">
                      <td className="py-3 font-medium">{inv.invoiceNumber}</td>
                      <td>{inv.issueDate.toLocaleDateString("en-NA")}</td>
                      <td>{inv.dueDate.toLocaleDateString("en-NA")}</td>
                      <td>N${(inv.totalCents / 100).toFixed(2)}</td>
                      <td>N${(inv.amountPaidCents / 100).toFixed(2)}</td>
                      <td>N${(inv.balanceCents / 100).toFixed(2)}</td>
                      <td>{inv.status.replaceAll("_", " ")}</td>
                    </tr>
                  ))}
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
                    <tr key={p.id} className="border-t border-border">
                      <td className="py-3 font-medium">{p.paymentDate.toLocaleDateString("en-NA")}</td>
                      <td>N${(p.amountCents / 100).toFixed(2)}</td>
                      <td>{p.method.replaceAll("_", " ")}</td>
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
    </DashboardLayout>
  );
}
