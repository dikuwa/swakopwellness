import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { receiptLineItems, receipts, clients, users } from "@/db/schema";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { DocumentPreview } from "@/components/document-preview";
import { hasPermission } from "@/auth/permissions";
import { voidReceiptAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Receipt Details — Dashboard",
};

function formatDate(d: Date | null) {
  if (!d) return "\u2014";
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

export default async function ReceiptDetailPage(props: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("financials:view");
  const { id } = await props.params;
  const db = getDb();

  const [receipt] = await db
    .select({
      id: receipts.id,
      receiptNumber: receipts.receiptNumber,
      amountCents: receipts.amountCents,
      paymentDate: receipts.paymentDate,
      paymentMethod: receipts.paymentMethod,
      paymentReference: receipts.paymentReference,
      notes: receipts.notes,
      description: receipts.description,
      voidedAt: receipts.voidedAt,
      voidReason: receipts.voidReason,
      clientId: receipts.clientId,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      receivedByName: users.name,
    })
    .from(receipts)
    .innerJoin(clients, eq(receipts.clientId, clients.id))
    .leftJoin(users, eq(receipts.receivedByUserId, users.id))
    .where(eq(receipts.id, id))
    .limit(1);

  const lineItems = await db
    .select()
    .from(receiptLineItems)
    .where(eq(receiptLineItems.receiptId, id))
    .orderBy(asc(receiptLineItems.sortOrder));

  if (!receipt) notFound();

  const canVoid = hasPermission(user.permissions, "documents:void");

  return (
    <DashboardShell>
      <Link href="/dashboard/receipts" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back to receipts</Link>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Receipt</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">{receipt.receiptNumber}</h1>
          </div>
          {receipt.voidedAt ? (
            <span className="inline-block self-start rounded-full bg-[oklch(0.55_0.20_36_/_0.12)] px-4 py-1.5 text-sm font-semibold text-[oklch(0.45_0.18_36)]">
              Voided
            </span>
          ) : (
            <span className="inline-block self-start rounded-full bg-[oklch(0.49_0.16_158_/_0.12)] px-4 py-1.5 text-sm font-semibold text-[oklch(0.40_0.14_158)]">
              Active
            </span>
          )}
        </div>

        {/* DocumentPreview for receipt */}
        <div className="mt-6">
          <DocumentPreview
            type="RECEIPT"
            documentNumber={receipt.receiptNumber}
            clientName={receipt.clientName}
            clientPhone={receipt.clientPhone ?? ""}
            clientEmail={receipt.clientEmail ?? ""}
            lineItems={lineItems.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              discountCents: item.discountCents,
              totalCents: item.quantity * item.unitPriceCents - item.discountCents,
            }))}
            subtotalCents={lineItems.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0)}
            discountCents={lineItems.reduce((s, i) => s + i.discountCents, 0)}
            taxCents={0}
            totalCents={receipt.amountCents}
            paidCents={receipt.amountCents}
            balanceCents={0}
            notes={receipt.notes ?? ""}
            terms=""
            bankingDetails=""
            dates={[
              { label: "Payment Date", value: formatDate(receipt.paymentDate) },
              { label: "Method", value: receipt.paymentMethod.replaceAll("_", " ") },
              ...(receipt.paymentReference ? [{ label: "Reference", value: receipt.paymentReference }] : []),
            ]}
          />
        </div>

        {receipt.voidedAt && (
          <div className="mt-8 rounded-2xl border border-border bg-surface-muted p-5">
            <p className="text-sm font-semibold text-[oklch(0.45_0.18_36)]">Voided</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(receipt.voidedAt)}</p>
            {receipt.voidReason ? <p className="mt-1 text-sm text-muted-foreground">Reason: {receipt.voidReason}</p> : null}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
          <a
            href={`/api/receipts/${id}/pdf`}
            target="_blank"
            className="h-11 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted inline-flex items-center"
          >
            Download PDF
          </a>
        </div>

        {!receipt.voidedAt && canVoid && (
          <div className="mt-10 border-t border-border pt-6">
            <h2 className="text-sm font-semibold">Void Receipt</h2>
            <form action={voidReceiptAction.bind(null, receipt.id)} className="mt-3 space-y-3">
              <textarea
                name="reason"
                rows={2}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Reason for voiding"
              />
              <button
                type="submit"
                className="h-11 rounded-xl bg-[oklch(0.55_0.20_36)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[oklch(0.45_0.20_36)]"
              >
                Void Receipt
              </button>
            </form>
          </div>
        )}
    </DashboardShell>
  );
}
