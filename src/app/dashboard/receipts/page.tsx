import Link from "next/link";
import { requirePermission } from "@/auth/session";
import { DashboardLayout } from "@/dashboard/components";
import { logoutAction } from "../actions";
import { getReceipts } from "@/dashboard/data";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number) {
  return `N$${(cents / 100).toFixed(2)}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-NA", { year: "numeric", month: "short", day: "numeric" });
}

export default async function ReceiptsPage() {
  await requirePermission("financials:view");
  const receipts = await getReceipts();

  return (
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Receipts</h1>
        </div>
          <Link
            href="/dashboard/receipts/new"
            className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 inline-flex items-center"
          >
            New Receipt
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto">
          {receipts.length === 0 ? (
            <p className="rounded-2xl bg-surface-muted p-5 text-sm text-muted-foreground">No receipts yet.</p>
          ) : (
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-3">Receipt</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => {
                  const voided = !!r.voidedAt;
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-3 font-medium">
                        <Link href={`/dashboard/receipts/${r.id}`} className="text-primary hover:underline">
                          {r.receiptNumber}
                        </Link>
                      </td>
                      <td>{r.clientName}</td>
                      <td>{formatCurrency(r.amountCents)}</td>
                      <td>{formatDate(r.paymentDate)}</td>
                      <td className="capitalize">{r.paymentMethod.replaceAll("_", " ")}</td>
                      <td>
                        {voided ? (
                          <span className="inline-block rounded-full bg-[oklch(0.55_0.20_36_/_0.12)] px-3 py-1 text-xs font-semibold text-[oklch(0.45_0.18_36)]">
                            Voided
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-[oklch(0.49_0.16_158_/_0.12)] px-3 py-1 text-xs font-semibold text-[oklch(0.40_0.14_158)]">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
    </DashboardLayout>
  );
}
