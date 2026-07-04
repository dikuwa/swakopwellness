import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getClients } from "@/dashboard/data";
import { createPaymentAction } from "./actions";
import { InvoiceSelector } from "./invoice-selector";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Record Payment — Dashboard",
};

export default async function NewPaymentPage(props: { searchParams: Promise<{ invoice_id?: string }> }) {
  await requirePermission("payments:record");
  const clients = await getClients();
  const sp = await props.searchParams;

  return (
    <DashboardShell>
      <h1 className="text-3xl font-semibold tracking-[-0.035em]">Record Payment</h1>
        <p className="mt-3 text-sm text-muted-foreground">Record a payment and optionally link it to an invoice.</p>
        <form action={createPaymentAction} className="mt-6 space-y-5">
          <InvoiceSelector
            clients={clients}
            preselectedInvoiceId={sp.invoice_id}
          />

          <div>
            <label htmlFor="amount" className="mb-2 block text-sm font-semibold">Amount (N$)</label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="paymentDate" className="mb-2 block text-sm font-semibold">Payment Date</label>
            <input
              id="paymentDate"
              name="paymentDate"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="method" className="mb-2 block text-sm font-semibold">Payment Method</label>
            <select
              id="method"
              name="method"
              required
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile">Mobile Payment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="generateReceipt" className="mb-2 block text-sm font-semibold">Receipt</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition-colors hover:bg-surface-muted">
              <input
                type="checkbox"
                id="generateReceipt"
                name="generateReceipt"
                defaultChecked
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Generate receipt now
            </label>
          </div>

          <div>
            <label htmlFor="reference" className="mb-2 block text-sm font-semibold">Reference (optional)</label>
            <input
              id="reference"
              name="reference"
              type="text"
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Payment reference"
            />
          </div>

          <div>
            <label htmlFor="notes" className="mb-2 block text-sm font-semibold">Notes (optional)</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Any additional notes"
            />
          </div>

          <button
            type="submit"
            className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Record Payment
          </button>
        </form>
    </DashboardShell>
  );
}
