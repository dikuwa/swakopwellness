"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardNav } from "@/dashboard/components";
import { createQuotationAction } from "./actions";

const today = new Date().toISOString().slice(0, 10);
const defaultValidUntil = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

interface Client {
  id: string;
  fullName: string;
}

interface Service {
  id: string;
  name: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: string;
  serviceId: string;
}

export function QuotationForm({
  clients,
  services,
}: {
  clients: Client[];
  services: Service[];
}) {
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: "", serviceId: "" },
  ]);

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: "", serviceId: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function handleServiceSelect(index: number, serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    updateItem(index, "serviceId", serviceId);
    if (service) {
      updateItem(index, "description", service.name);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-4xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
        <DashboardNav />
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">New Quotation</h1>
        <form action={createQuotationAction} className="mt-8 space-y-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="client_id" className="block text-sm font-semibold mb-1.5">Client *</label>
              <select
                id="client_id"
                name="client_id"
                required
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="issue_date" className="block text-sm font-semibold mb-1.5">Issue Date *</label>
              <input
                id="issue_date"
                name="issue_date"
                type="date"
                required
                defaultValue={today}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor="valid_until" className="block text-sm font-semibold mb-1.5">Valid Until</label>
              <input
                id="valid_until"
                name="valid_until"
                type="date"
                defaultValue={defaultValidUntil}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Line Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="h-9 rounded-xl border border-border px-3 text-sm font-semibold transition-colors hover:bg-surface-muted"
              >
                Add Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-background p-4">
                  <input type="hidden" name={`service_id_${i}`} value={item.serviceId} />
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Service</label>
                    <select
                      value={item.serviceId}
                      onChange={(e) => handleServiceSelect(i, e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Custom item</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Description *</label>
                    <input
                      name={`description_${i}`}
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      placeholder="Item description"
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Qty *</label>
                    <input
                      name={`quantity_${i}`}
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Unit Price *</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">N$</span>
                      <input
                        name={`unit_price_${i}`}
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                        placeholder="0.00"
                        className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="h-11 px-3 text-sm text-red-600 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <input type="hidden" name="line_count" value={items.length} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="discount_type" className="block text-sm font-semibold mb-1.5">Discount Type</label>
              <select
                id="discount_type"
                name="discount_type"
                defaultValue="none"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="none">No discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (N$)</option>
              </select>
            </div>
            <div>
              <label htmlFor="discount_value" className="block text-sm font-semibold mb-1.5">Discount Value</label>
              <input
                id="discount_value"
                name="discount_value"
                type="number"
                min="0"
                placeholder="0"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold mb-1.5">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              />
            </div>
            <div>
              <label htmlFor="terms" className="block text-sm font-semibold mb-1.5">Terms</label>
              <textarea
                id="terms"
                name="terms"
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <button
              type="submit"
              className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Create Quotation
            </button>
            <Link
              href="/dashboard/quotations"
              className="h-11 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
