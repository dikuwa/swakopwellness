import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { receipts, clients, users } from "@/db/schema";
import { requirePermission } from "@/auth/session";
import { DashboardLayout } from "@/dashboard/components";
import { logoutAction } from "../../actions";
import { hasPermission } from "@/auth/permissions";
import { voidReceiptAction } from "./actions";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number) {
  return `N$${(cents / 100).toFixed(2)}`;
}

function formatDate(d: Date | null) {
  if (!d) return "\u2014";
  return d.toLocaleDateString("en-NA", { year: "numeric", month: "long", day: "numeric" });
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
      clientName: clients.fullName,
      clientPhone: clients.phone,
      receivedByName: users.name,
    })
    .from(receipts)
    .innerJoin(clients, eq(receipts.clientId, clients.id))
    .leftJoin(users, eq(receipts.receivedByUserId, users.id))
    .where(eq(receipts.id, id))
    .limit(1);

  if (!receipt) notFound();

  const canVoid = hasPermission(user.permissions, "documents:void");

  return (
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
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

        <div className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Client</p>
            <p className="mt-1 font-semibold">{receipt.clientName}</p>
            {receipt.clientPhone && <p className="text-sm text-muted-foreground">{receipt.clientPhone}</p>}
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Amount</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{formatCurrency(receipt.amountCents)}</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Payment Date</p>
            <p className="mt-1 font-medium">{formatDate(receipt.paymentDate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Payment Method</p>
            <p className="mt-1 font-medium capitalize">{receipt.paymentMethod.replaceAll("_", " ")}</p>
          </div>
          {receipt.paymentReference && (
            <div>
              <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Payment Reference</p>
              <p className="mt-1 font-medium">{receipt.paymentReference}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Received By</p>
            <p className="mt-1 font-medium">{receipt.receivedByName ?? "\u2014"}</p>
          </div>
        </div>

        {receipt.description && (
          <div className="mt-6">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Description</p>
            <p className="mt-1 text-sm">{receipt.description}</p>
          </div>
        )}

        {receipt.notes && (
          <div className="mt-6">
            <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{receipt.notes}</p>
          </div>
        )}

        {receipt.voidedAt && (
          <div className="mt-8 rounded-2xl border border-border bg-surface-muted p-5">
            <p className="text-sm font-semibold text-[oklch(0.45_0.18_36)]">Voided</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(receipt.voidedAt)}</p>
            {receipt.voidReason && <p className="mt-1 text-sm text-muted-foreground">Reason: {receipt.voidReason}</p>}
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
    </DashboardLayout>
  );
}
