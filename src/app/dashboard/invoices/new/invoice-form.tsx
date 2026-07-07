"use client";

import Link from "next/link";
import { useState } from "react";
import { Select, DatePicker } from "@/ui/components";
import { createInvoiceAction } from "./actions";
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

interface Props {
  clients: Client[];
  services: ServiceOption[];
}

export function InvoiceForm({ clients, services }: Props) {
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [items, setItems] = useState<EditorLineItem[]>([createEmptyLineItem()]);
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  const lineTotals = calculateDocumentTotals(items);
  const docLevelDiscountCents = discountType === "percentage"
    ? Math.round(lineTotals.subtotalCents * (parseInt(discountValue) || 0) / 100)
    : discountType === "fixed"
    ? Math.round((parseFloat(discountValue) || 0) * 100)
    : 0;
  const totalCents = lineTotals.subtotalCents - lineTotals.totalDiscountCents - docLevelDiscountCents;
  const paidCents = Math.round((parseFloat(amountPaid) || 0) * 100);
  const balanceCents = Math.max(totalCents - paidCents, 0);

  return (
    <>
      <Link
        href="/dashboard/invoices"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back to Invoices
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">New Invoice</h1>

      <form action={createInvoiceAction} className="mt-8 space-y-6">
        <input type="hidden" name="line_count" value={items.length} />
        <input type="hidden" name="doc_discount_cents" value={docLevelDiscountCents} />

        {/* Client & Dates */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label htmlFor="client_id" className="mb-1.5 block text-sm font-semibold">Client *</label>
            <Select
              id="client_id"
              name="client_id"
              required
              searchable
              options={clients.map((c) => ({ value: c.id, label: c.fullName }))}
              placeholder="Select a client"
            />
          </div>
          <div>
            <label htmlFor="issue_date" className="mb-1.5 block text-sm font-semibold">Issue Date *</label>
            <DatePicker
              id="issue_date"
              name="issue_date"
              required
              value={issueDate}
              onChange={(v) => setIssueDate(v)}
              placeholder="Select date"
            />
          </div>
          <div>
            <label htmlFor="due_date" className="mb-1.5 block text-sm font-semibold">Due Date *</label>
            <DatePicker
              id="due_date"
              name="due_date"
              required
              value={dueDate}
              onChange={(v) => setDueDate(v)}
              placeholder="Select date"
            />
          </div>
        </div>

        {/* Line Items */}
        <DocumentLineItemsEditor
          items={items}
          onChange={setItems}
          services={services}
          label="Invoice Line Items"
        />

        {/* Document-level Discount */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="discount_type" className="mb-1.5 block text-sm font-semibold">Discount Type</label>
            <Select
              id="discount_type"
              name="discount_type"
              value={discountType}
              onChange={setDiscountType}
              options={[
                { value: "none", label: "No discount" },
                { value: "percentage", label: "Percentage (%)" },
                { value: "fixed", label: "Fixed (N$)" },
              ]}
              placeholder="Discount type"
            />
          </div>
          <div>
            <label htmlFor="discount_value" className="mb-1.5 block text-sm font-semibold">Discount Value</label>
            <div className="relative">
              {discountType === "fixed" && (
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">N$</span>
              )}
              <input
                id="discount_value"
                name="discount_value"
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                className={`h-11 w-full rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${discountType === "fixed" ? "pl-9 pr-3" : "px-3"}`}
              />
            </div>
          </div>
        </div>

        {/* Amount Paid */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="amountPaid" className="mb-1.5 block text-sm font-semibold">Amount Paid (N$)</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">N$</span>
              <input
                id="amountPaid"
                name="amount_paid"
                type="number"
                step="0.01"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex items-end">
            <div className="w-full rounded-xl border border-border bg-surface-muted p-3 text-sm">
              <span className="text-muted-foreground">Balance Due: </span>
              <span className="font-semibold">N${(balanceCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label htmlFor="terms" className="mb-1.5 block text-sm font-semibold">Terms</label>
            <textarea
              id="terms"
              name="terms"
              rows={3}
              className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 border-t border-border pt-4">
          <button
            type="submit"
            className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Create Invoice
          </button>
          <Link
            href="/dashboard/invoices"
            className="flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
