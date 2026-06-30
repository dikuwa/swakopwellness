import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/auth/session";
import { DashboardLayout } from "@/dashboard/components";
import { logoutAction } from "../../actions";
import { getInvoiceById, getClientById } from "@/dashboard/data";
import { emailInvoiceAction, issueInvoiceAction, voidInvoiceAction } from "./actions";

export const dynamic = "force-dynamic";

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
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
      <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/dashboard/invoices" className="text-sm text-muted-foreground hover:text-foreground">&larr; Invoices</Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">{invoice.invoiceNumber}</h1>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="mt-1 font-semibold">{client?.fullName ?? "Unknown"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Issue Date</p>
            <p className="mt-1">{invoice.issueDate.toLocaleDateString("en-NA")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="mt-1">{invoice.dueDate.toLocaleDateString("en-NA")}</p>
          </div>
          {invoice.issuedAt && (
            <div>
              <p className="text-sm text-muted-foreground">Issued At</p>
              <p className="mt-1">{new Date(invoice.issuedAt).toLocaleDateString("en-NA")}</p>
            </div>
          )}
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-3">Description</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Discount</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => {
                const lineTotal = item.quantity * item.unitPriceCents - item.discountCents;
                return (
                  <tr key={item.id} className="border-t border-border">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">N${(item.unitPriceCents / 100).toFixed(2)}</td>
                    <td className="py-3 text-right">{item.discountCents > 0 ? `N$${(item.discountCents / 100).toFixed(2)}` : "—"}</td>
                    <td className="py-3 text-right font-medium">N${(lineTotal / 100).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>N${(invoice.subtotalCents / 100).toFixed(2)}</span>
          </div>
          {invoice.discountCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Discount
                {invoice.discountType === "percentage" && invoice.discountValue
                  ? ` (${invoice.discountValue}%)`
                  : ""}
              </span>
              <span className="text-red-600">- N${(invoice.discountCents / 100).toFixed(2)}</span>
            </div>
          )}
          {invoice.taxCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>N${(invoice.taxCents / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>N${(invoice.totalCents / 100).toFixed(2)}</span>
          </div>
          {invoice.amountPaidCents > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Amount Paid</span>
              <span>- N${(invoice.amountPaidCents / 100).toFixed(2)}</span>
            </div>
          )}
          {invoice.balanceCents > 0 && (
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Balance Due</span>
              <span>N${(invoice.balanceCents / 100).toFixed(2)}</span>
            </div>
          )}
        </div>

        {(invoice.notes || invoice.terms) && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {invoice.notes && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Terms</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

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
            <form action={voidInvoiceAction} onSubmit={(e) => {
              const reason = prompt("Reason for voiding this invoice:");
              if (!reason) { e.preventDefault(); return; }
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = "reason";
              input.value = reason;
              e.currentTarget.appendChild(input);
            }}>
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <button
                type="submit"
                className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Void Invoice
              </button>
            </form>
          )}
        </div>
    </DashboardLayout>
  );
}
