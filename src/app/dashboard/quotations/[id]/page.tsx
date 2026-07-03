import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { logoutAction } from "../../actions";
import { getClientById, getQuotationById } from "@/dashboard/data";
import { acceptQuotationAction, convertToInvoiceAction, issueQuotationAction, rejectQuotationAction, voidQuotationAction } from "./actions";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  issued: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
  converted: "bg-purple-100 text-purple-700",
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

export default async function QuotationDetailPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("financials:view");
  const { id } = await props.params;
  const quotation = await getQuotationById(id);

  if (!quotation) notFound();

  const client = await getClientById(quotation.clientId);
  const isDraft = quotation.status === "draft";
  const isIssued = quotation.status === "issued";
  const isAccepted = quotation.status === "accepted";
  const canIssue = isDraft;
  const canAccept = isIssued;
  const canReject = isIssued;
  const canConvert = isAccepted;
  const canVoid = !["voided", "converted"].includes(quotation.status);
  const canDownload = !["draft", "voided"].includes(quotation.status);

  return (
    <DashboardShell>
      <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/dashboard/quotations" className="text-sm text-muted-foreground hover:text-foreground">&larr; Quotations</Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">{quotation.quotationNumber}</h1>
          </div>
          <StatusBadge status={quotation.status} />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="mt-1 font-semibold">{client?.fullName ?? "Unknown"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Issue Date</p>
            <p className="mt-1">{quotation.issueDate.toLocaleDateString("en-NA")}</p>
          </div>
          {quotation.validUntil && (
            <div>
              <p className="text-sm text-muted-foreground">Valid Until</p>
              <p className="mt-1">{quotation.validUntil.toLocaleDateString("en-NA")}</p>
            </div>
          )}
          {quotation.issuedAt && (
            <div>
              <p className="text-sm text-muted-foreground">Issued At</p>
              <p className="mt-1">{new Date(quotation.issuedAt).toLocaleDateString("en-NA")}</p>
            </div>
          )}
          {quotation.acceptedAt && (
            <div>
              <p className="text-sm text-muted-foreground">Accepted At</p>
              <p className="mt-1">{new Date(quotation.acceptedAt).toLocaleDateString("en-NA")}</p>
            </div>
          )}
          {quotation.convertedToInvoiceId && (
            <div>
              <p className="text-sm text-muted-foreground">Converted To</p>
              <Link href={`/dashboard/invoices/${quotation.convertedToInvoiceId}`} className="mt-1 block font-medium text-primary underline underline-offset-4">
                View Invoice
              </Link>
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
              {quotation.lineItems.map((item) => {
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
            <span>N${(quotation.subtotalCents / 100).toFixed(2)}</span>
          </div>
          {quotation.discountCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Discount
                {quotation.discountType === "percentage" && quotation.discountValue
                  ? ` (${quotation.discountValue}%)`
                  : ""}
              </span>
              <span className="text-red-600">- N${(quotation.discountCents / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span>N${(quotation.totalCents / 100).toFixed(2)}</span>
          </div>
        </div>

        {(quotation.notes || quotation.terms) && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {quotation.notes && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}
            {quotation.terms && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Terms</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{quotation.terms}</p>
              </div>
            )}
          </div>
        )}

        {quotation.rejectedReason && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm">
            <p className="font-semibold text-red-700">Rejection Reason</p>
            <p className="mt-1 text-red-600">{quotation.rejectedReason}</p>
          </div>
        )}

        {quotation.voidReason && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm">
            <p className="font-semibold text-red-700">Void Reason</p>
            <p className="mt-1 text-red-600">{quotation.voidReason}</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
          {canIssue && (
            <form action={issueQuotationAction}>
              <input type="hidden" name="quotation_id" value={quotation.id} />
              <button
                type="submit"
                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Issue Quotation
              </button>
            </form>
          )}
          {canAccept && (
            <form action={acceptQuotationAction}>
              <input type="hidden" name="quotation_id" value={quotation.id} />
              <button
                type="submit"
                className="h-11 rounded-xl border border-green-600 px-5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
              >
                Accept
              </button>
            </form>
          )}
          {canReject && (
            <details className="group">
              <summary className="h-11 inline-flex cursor-pointer items-center rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 list-none [&::-webkit-details-marker]:hidden">
                Reject
              </summary>
              <form action={rejectQuotationAction} className="mt-3 flex gap-2">
                <input type="hidden" name="quotation_id" value={quotation.id} />
                <input
                  type="text"
                  name="reason"
                  placeholder="Reason for rejection"
                  required
                  className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Confirm Reject
                </button>
              </form>
            </details>
          )}
          {canConvert && (
            <form action={convertToInvoiceAction}>
              <input type="hidden" name="quotation_id" value={quotation.id} />
              <button
                type="submit"
                className="h-11 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
              >
                Convert to Invoice
              </button>
            </form>
          )}
          {canDownload && (
            <a
              href={`/api/quotations/${quotation.id}/pdf`}
              target="_blank"
              className="h-11 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted inline-flex items-center"
            >
              Download PDF
            </a>
          )}
          {canVoid && (
            <details className="group">
              <summary className="h-11 inline-flex cursor-pointer items-center rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 list-none [&::-webkit-details-marker]:hidden">
                Void
              </summary>
              <form action={voidQuotationAction} className="mt-3 flex gap-2">
                <input type="hidden" name="quotation_id" value={quotation.id} />
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
