"use client";

import Link from "next/link";
import { useState } from "react";
import { createReceiptAction } from "./actions";
import { Select, DatePicker } from "@/ui/components";
import {
  DocumentLineItemsEditor,
  createEmptyLineItem,
  type EditorLineItem,
  type ServiceOption,
} from "@/components/document-line-items-editor";
import { calculateDocumentTotals } from "@/documents/calculate";

interface Client {
  id: string;
  fullName: string;
}

interface InitialLineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  serviceId: string | null;
}

interface Props {
  clients: Client[];
  services: ServiceOption[];
  initialInvoiceId?: string;
  initialClientId?: string;
  initialLineItems?: InitialLineItem[];
  initialAmountCents?: number;
}

const methodOptions = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile", label: "Mobile Payment" },
  { value: "other", label: "Other" },
];

function mapInitialLineItems(items?: InitialLineItem[]): EditorLineItem[] {
  if (!items || items.length === 0) return [createEmptyLineItem()];
  let keyCounter = 0;
  return items.map((item) => ({
    _key: `init_${++keyCounter}_${Date.now()}`,
    itemType: item.serviceId ? ("SERVICE" as const) : ("CUSTOM" as const),
    serviceId: item.serviceId,
    description: item.description,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    discountCents: item.discountCents,
  }));
}

export function ReceiptForm({ clients, services, initialInvoiceId, initialClientId, initialLineItems, initialAmountCents }: Props) {
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<EditorLineItem[]>(() => mapInitialLineItems(initialLineItems));
  const [amountPaid, setAmountPaid] = useState(initialAmountCents != null ? (initialAmountCents / 100).toFixed(2) : "");

  const totals = calculateDocumentTotals(items);

  return (
    <>
      <Link
        href="/dashboard/receipts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back to Receipts
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">New Receipt</h1>
      <p className="mt-3 text-sm text-muted-foreground">Record a payment and generate a receipt with line items.</p>

      <form action={createReceiptAction} className="mt-8 space-y-6">
        {/* Hidden fields */}
        <input type="hidden" name="line_count" value={items.length} />

        {/* Client & Dates */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label htmlFor="clientId" className="mb-1.5 block text-sm font-semibold">Client *</label>
            <Select
              id="clientId"
              name="clientId"
              required
              searchable
              defaultValue={initialClientId ?? ""}
              options={clients.map((c) => ({ value: c.id, label: c.fullName }))}
              placeholder="Select client"
            />
          </div>
          <div>
            <label htmlFor="paymentDate" className="mb-1.5 block text-sm font-semibold">Payment Date *</label>
            <DatePicker
              id="paymentDate"
              name="paymentDate"
              required
              value={paymentDate}
              onChange={(v) => setPaymentDate(v)}
              placeholder="Select date"
            />
          </div>
          <div>
            <label htmlFor="method" className="mb-1.5 block text-sm font-semibold">Payment Method *</label>
            <Select
              id="method"
              name="method"
              required
              options={methodOptions}
              placeholder="Select method"
            />
          </div>
        </div>

        {/* Linked Invoice + Reference */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="invoiceId" className="mb-1.5 block text-sm font-semibold">Linked Invoice (optional)</label>
            <input
              id="invoiceId"
              name="invoiceId"
              type="text"
              defaultValue={initialInvoiceId ?? ""}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Invoice ID"
            />
          </div>
          <div>
            <label htmlFor="reference" className="mb-1.5 block text-sm font-semibold">Reference (optional)</label>
            <input
              id="reference"
              name="reference"
              type="text"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Payment reference"
            />
          </div>
        </div>

        {/* Line Items */}
        <DocumentLineItemsEditor
          items={items}
          onChange={setItems}
          services={services}
          label="Receipt Line Items"
        />

        {/* Amount Paid Override */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="amountOverride" className="mb-1.5 block text-sm font-semibold">
              Amount Paid (N$)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Leave empty to use the line items total. Override to accept a partial or different amount.
            </p>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">N$</span>
              <input
                id="amountOverride"
                name="amountOverride"
                type="number"
                step="0.01"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder={(totals.totalCents / 100).toFixed(2)}
                className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold">Receipt Description</label>
            <input
              id="description"
              name="description"
              type="text"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. Payment for wellness services"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold">Notes (optional)</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Any additional notes"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 border-t border-border pt-4">
          <button
            type="submit"
            className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Create Receipt
          </button>
          <Link
            href="/dashboard/receipts"
            className="flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
