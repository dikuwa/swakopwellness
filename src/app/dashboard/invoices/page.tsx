import Link from "next/link";
import { requirePermission } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { getInvoices } from "@/dashboard/data";

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

export default async function InvoicesPage() {
  await requirePermission("financials:view");
  const invoices = await getInvoices();

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-6xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
        <DashboardNav />
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Invoices</h1>
          <Link
            href="/dashboard/invoices/new"
            className="h-11 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted flex items-center"
          >
            New Invoice
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-3">Invoice</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border hover:bg-surface-muted/50">
                  <td className="py-3">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium hover:text-primary block">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td>{inv.clientName}</td>
                  <td>{inv.issueDate.toLocaleDateString("en-NA")}</td>
                  <td>{inv.dueDate.toLocaleDateString("en-NA")}</td>
                  <td>N${(inv.totalCents / 100).toFixed(2)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>N${(inv.balanceCents / 100).toFixed(2)}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
