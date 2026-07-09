import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { DocumentPreview } from "@/components/document-preview";
import { getClientById, getQuotationById } from "@/dashboard/data";
import { PendingSubmitButton } from "@/app/dashboard/pending-submit-button";
import { acceptQuotationAction, convertToInvoiceAction, duplicateQuotationAction, emailQuotationAction, issueQuotationAction, rejectQuotationAction, voidQuotationAction } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Quotation ${id.slice(0, 8)} — Dashboard` };
}

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
  const canEmail = !["draft", "voided"].includes(quotation.status);

  return (
    <DashboardShell>
      <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/dashboard/documents?type=quotation" className="text-sm text-muted-foreground hover:text-foreground">&larr; Documents</Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">{quotation.quotationNumber}</h1>
          </div>
          <StatusBadge status={quotation.status} />
        </div>

        {/* DocumentPreview replaces the raw table + totals + notes display */}
      <div className="mt-6">
        <DocumentPreview
          type="QUOTATION"
          documentNumber={quotation.quotationNumber}
          clientName={client?.fullName ?? "Unknown"}
          clientPhone={(client?.phone as string) ?? ""}
          clientEmail={(client?.email as string) ?? ""}
          lineItems={quotation.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            discountCents: item.discountCents,
            totalCents: item.quantity * item.unitPriceCents - item.discountCents,
          }))}
          subtotalCents={quotation.subtotalCents}
          discountCents={quotation.discountCents}
          taxCents={0}
          totalCents={quotation.totalCents}
          paidCents={0}
          balanceCents={0}
          notes={quotation.notes ?? ""}
          terms={quotation.terms ?? ""}
          dates={[
            { label: "Issue Date", value: quotation.issueDate.toLocaleDateString("en-GB") },
            ...(quotation.validUntil ? [{ label: "Valid Until", value: quotation.validUntil.toLocaleDateString("en-GB") }] : []),
          ]}
        />
      </div>

      {/* Status metadata below preview */}
      <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4 text-sm">
        {quotation.issuedAt && (
          <div>
            <p className="text-xs text-muted-foreground">Issued At</p>
            <p className="font-medium">{new Date(quotation.issuedAt).toLocaleDateString("en-GB")}</p>
          </div>
        )}
        {quotation.acceptedAt && (
          <div>
            <p className="text-xs text-muted-foreground">Accepted At</p>
            <p className="font-medium">{new Date(quotation.acceptedAt).toLocaleDateString("en-GB")}</p>
          </div>
        )}
        {quotation.convertedToInvoiceId && (
          <div>
            <p className="text-xs text-muted-foreground">Converted To</p>
            <Link href={`/dashboard/invoices/${quotation.convertedToInvoiceId}`} className="font-medium text-primary underline underline-offset-4">
              View Invoice
            </Link>
          </div>
        )}
      </div>

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
            <>
              <Link
                href={`/dashboard/quotations/${quotation.id}/edit`}
                className="h-11 rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface-muted inline-flex items-center"
              >
                Edit
              </Link>
              <form action={issueQuotationAction}>
                <input type="hidden" name="quotation_id" value={quotation.id} />
                <PendingSubmitButton
                  pendingChildren="Issuing..."
                  className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Issue Quotation
                </PendingSubmitButton>
              </form>
            </>
          )}
          {canAccept && (
            <form action={acceptQuotationAction}>
              <input type="hidden" name="quotation_id" value={quotation.id} />
              <PendingSubmitButton
                pendingChildren="Accepting..."
                className="h-11 rounded-xl border border-green-600 px-5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
              >
                Accept
              </PendingSubmitButton>
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
                <PendingSubmitButton
                  pendingChildren="Rejecting..."
                  className="h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Confirm Reject
                </PendingSubmitButton>
              </form>
            </details>
          )}
          {canConvert && (
            <form action={convertToInvoiceAction}>
              <input type="hidden" name="quotation_id" value={quotation.id} />
              <PendingSubmitButton
                pendingChildren="Converting..."
                className="h-11 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
              >
                Convert to Invoice
              </PendingSubmitButton>
            </form>
          )}
          <form action={duplicateQuotationAction}>
            <input type="hidden" name="quotation_id" value={quotation.id} />
            <PendingSubmitButton
              pendingChildren="Duplicating..."
              className="h-11 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
            >
              Duplicate
            </PendingSubmitButton>
          </form>
          {canEmail && (
            <form action={emailQuotationAction}>
              <input type="hidden" name="quotation_id" value={quotation.id} />
              <PendingSubmitButton
                pendingChildren="Sending..."
                className="h-11 rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface-muted"
              >
                Email Quotation
              </PendingSubmitButton>
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
                <PendingSubmitButton
                  pendingChildren="Voiding..."
                  className="h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Confirm Void
                </PendingSubmitButton>
              </form>
            </details>
          )}
        </div>
    </DashboardShell>
  );
}
