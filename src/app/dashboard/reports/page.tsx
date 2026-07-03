import Link from "next/link";
import type { ReactNode } from "react";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDashboardReports } from "@/dashboard/data";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return `N$${(cents / 100).toLocaleString("en-NA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function StatCard({ title, value, note }: { title: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

function ExportLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-surface-muted">
      {children}
    </Link>
  );
}

export default async function ReportsPage() {
  await requirePermission("financials:view");
  const reports = await getDashboardReports();

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Reports</p>
          <h1 className="mt-2 text-2xl sm:text-3xl tracking-[-0.03em]">Operational Reports</h1>
          <p className="mt-3 max-w-[68ch] text-sm leading-6 text-muted-foreground">
            Review booking, client, follow-up and financial summaries. Exports exclude suitability responses and other sensitive screening details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportLink href="/dashboard/reports/export/bookings">Bookings CSV</ExportLink>
          <ExportLink href="/dashboard/reports/export/clients">Clients CSV</ExportLink>
          <ExportLink href="/dashboard/reports/export/invoices">Invoices CSV</ExportLink>
          <ExportLink href="/dashboard/reports/export/payments">Payments CSV</ExportLink>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total bookings" value={reports.cards.bookingCount} />
        <StatCard title="Total clients" value={reports.cards.clientCount} />
        <StatCard title="Follow-ups due" value={reports.cards.followUpsDue} />
        <StatCard title="Outstanding invoice balance" value={money(reports.cards.outstandingInvoiceCents)} />
        <StatCard title="Payments received" value={money(reports.cards.paymentsLast30Cents)} note="Last 30 days, excluding voided payments" />
        <StatCard title="Receipts issued" value={money(reports.cards.receiptsLast30Cents)} note="Last 30 days, excluding voided receipts" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="text-lg font-semibold">Bookings By Status</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {reports.bookingsByStatus.map((row) => (
                  <tr key={row.status} className="border-t border-border">
                    <td className="py-3 capitalize text-muted-foreground">{label(row.status)}</td>
                    <td className="py-3 text-right font-semibold">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="text-lg font-semibold">Bookings By Source</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {reports.bookingsBySource.map((row) => (
                  <tr key={row.source} className="border-t border-border">
                    <td className="py-3 capitalize text-muted-foreground">{label(row.source)}</td>
                    <td className="py-3 text-right font-semibold">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="text-lg font-semibold">Invoice Balances</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr><th className="py-2">Status</th><th className="py-2 text-right">Count</th><th className="py-2 text-right">Balance</th></tr>
              </thead>
              <tbody>
                {reports.invoiceBalancesByStatus.map((row) => (
                  <tr key={row.status} className="border-t border-border">
                    <td className="py-3 capitalize text-muted-foreground">{label(row.status)}</td>
                    <td className="py-3 text-right font-semibold">{row.count}</td>
                    <td className="py-3 text-right font-semibold">{money(row.balanceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="text-lg font-semibold">Payments By Method</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr><th className="py-2">Method</th><th className="py-2 text-right">Count</th><th className="py-2 text-right">Amount</th></tr>
              </thead>
              <tbody>
                {reports.paymentsByMethod.map((row) => (
                  <tr key={row.method} className="border-t border-border">
                    <td className="py-3 capitalize text-muted-foreground">{label(row.method)}</td>
                    <td className="py-3 text-right font-semibold">{row.count}</td>
                    <td className="py-3 text-right font-semibold">{money(row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
