import Link from "next/link";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { logoutAction } from "../actions";
import { getQuotations } from "@/dashboard/data";

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

export default async function QuotationsPage() {
  await requirePermission("financials:view");
  const list = await getQuotations();

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Quotations</h1>
        </div>
          <Link
            href="/dashboard/quotations/new"
            className="h-11 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted flex items-center"
          >
            New Quotation
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-3">Quotation</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Valid Until</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((q) => (
                <tr key={q.id} className="border-t border-border hover:bg-surface-muted/50">
                  <td className="py-3">
                    <Link href={`/dashboard/quotations/${q.id}`} className="font-medium hover:text-primary block">
                      {q.quotationNumber}
                    </Link>
                  </td>
                  <td>{q.clientName}</td>
                  <td>{q.issueDate.toLocaleDateString("en-NA")}</td>
                  <td>{q.validUntil ? q.validUntil.toLocaleDateString("en-NA") : "—"}</td>
                  <td>N${(q.totalCents / 100).toFixed(2)}</td>
                  <td><StatusBadge status={q.status} /></td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/quotations/${q.id}`} className="font-semibold text-primary hover:underline">Preview</Link>
                      <a href={`/api/quotations/${q.id}/pdf`} target="_blank" className="font-semibold text-primary hover:underline">PDF</a>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No quotations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </DashboardShell>
  );
}
