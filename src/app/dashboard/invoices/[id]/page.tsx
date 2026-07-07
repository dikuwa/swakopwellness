import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { DocumentPreview } from "@/components/document-preview";
import { getInvoiceById, getClientById } from "@/dashboard/data";
import { emailInvoiceAction, issueInvoiceAction, voidInvoiceAction } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice ${id.slice(0, 8)} — Dashboard` };
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  issued: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  voided: "bg-gray-100 text-gray-400 line-through",
};

function StatusBadge({ status }: { status: string }) {
  const cls = statusStyles[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default async function InvoiceDetailPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("financials:view");
  const { id } = await props.params;
  const invoice = await getInvoiceById(id);

  if (!invoice) notFound();

  const client = await getClientById(invoice.clientId);
  const canIssue = invoice.status === "draft";
  const canVoid = !["voided", "paid"].includes(invoice.status);
  const canRecordPayment = ["issued", "partially_paid", "overdue"].includes(invoice.status);
  const canEmail = !["draft", "voided"].includes(invoice.status);

  return (
    <DashboardShell>
      <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/dashboard/invoices" className="text-sm text-muted-foreground hover:text-foreground">&larr; Invoices</Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">{invoice.invoiceNumber}</h1>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        {/* DocumentPreview replaces the raw table + totals + notes display */}
      <div className="mt-6">
        <DocumentPreview
          type="INVOICE"
          documentNumber={invoice.invoiceNumber}
          clientName={client?.fullName ?? "Unknown"}
          clientPhone={(client?.phone as string) ?? ""}
          clientEmail={(client?.email as string) ?? ""}
          lineItems={invoice.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            discountCents: item.discountCents,
            totalCents: item.quantity * item.unitPriceCents - item.discountCents,
          }))}
          subtotalCents={invoice.subtotalCents}
          discountCents={invoice.discountCents}
          taxCents={invoice.taxCents}
          totalCents={invoice.totalCents}
          paidCents={invoice.amountPaidCents}
          balanceCents={invoice.balanceCents}
          notes={invoice.notes ?? ""}
          terms={invoice.terms ?? ""}
          dates={[
            { label: "Issue Date", value: invoice.issueDate.toLocaleDateString("en-GB") },
            { label: "Due Date", value: invoice.dueDate.toLocaleDateString("en-GB") },
          ]}
        />
      </div>

        {invoice.voidReason && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm">
            <p className="font-semibold text-red-700">Void Reason</p>
            <p className="mt-1 text-red-600">{invoice.voidReason}</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
          {canIssue && (
            <form action={issueInvoiceAction}>
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <button
                type="submit"
                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Issue Invoice
              </button>
            </form>
          )}
          {canEmail && (
            <form action={emailInvoiceAction}>
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <button
                type="submit"
                className="h-11 rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface-muted"
              >
                Email Invoice
              </button>
            </form>
          )}
          {canRecordPayment && (
            <Link
              href={`/dashboard/payments/new?invoice_id=${invoice.id}`}
              className="h-11 rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface-muted flex items-center"
            >
              Record Payment
            </Link>
          )}
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            className="h-11 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted inline-flex items-center"
          >
            Download PDF
          </a>
          {canVoid && (
            <details className="group">
              <summary className="h-11 inline-flex cursor-pointer items-center rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 list-none [&::-webkit-details-marker]:hidden">
                Void Invoice
              </summary>
              <form action={voidInvoiceAction} className="mt-3 flex gap-2">
                <input type="hidden" name="invoice_id" value={invoice.id} />
                <input
                  type="text"
                  name="reason"
                  placeholder="Reason for voiding"
                  required
                  className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Confirm Void
                </button>
              </form>
            </details>
          )}
        </div>
    </DashboardShell>
  );
}
