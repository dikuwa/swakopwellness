import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { logoutAction } from "../../actions";
import { getClients } from "@/dashboard/data";
import { createReceiptAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewReceiptPage() {
  await requirePermission("documents:create");
  const clients = await getClients();

  return (
    <DashboardShell>
      <h1 className="text-3xl font-semibold tracking-[-0.035em]">New Receipt</h1>
        <p className="mt-3 text-sm text-muted-foreground">Record a payment and generate a receipt.</p>
        <form action={createReceiptAction} className="mt-6 space-y-5">
          <div>
            <label htmlFor="clientId" className="mb-2 block text-sm font-semibold">Client</label>
            <select
              id="clientId"
              name="clientId"
              required
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </div>

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
            <label htmlFor="description" className="mb-2 block text-sm font-semibold">Payment Description</label>
            <input
              id="description"
              name="description"
              type="text"
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Basic Health Scan, consultation, custom item"
            />
          </div>

          <div>
            <label htmlFor="invoiceId" className="mb-2 block text-sm font-semibold">Linked Invoice (optional)</label>
            <input
              id="invoiceId"
              name="invoiceId"
              type="text"
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Invoice ID"
            />
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
            Create Receipt
          </button>
        </form>
    </DashboardShell>
  );
}
