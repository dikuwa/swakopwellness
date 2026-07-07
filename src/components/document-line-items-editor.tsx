"use client";

import { useCallback, useMemo } from "react";
import { Select } from "@/ui/components";
import { Plus, Trash2 } from "lucide-react";
import { calculateLineItem, fmtCents, type LineItemInput } from "@/documents/calculate";

export interface ServiceOption {
  id: string;
  name: string;
  priceCents: number;
}

export interface EditorLineItem extends LineItemInput {
  /** Temporary client-side key for React rendering */
  _key: string;
  itemType: "SERVICE" | "CUSTOM";
}

interface Props {
  items: EditorLineItem[];
  onChange: (items: EditorLineItem[]) => void;
  services: ServiceOption[];
  /** Optional label for the section */
  label?: string;
  /** Minimum items to always show (default 1) */
  minItems?: number;
}

let nextKey = 1;
function generateKey(): string {
  return `li_${nextKey++}_${Date.now()}`;
}

export function createEmptyLineItem(itemType: "SERVICE" | "CUSTOM" = "CUSTOM"): EditorLineItem {
  return {
    _key: generateKey(),
    itemType,
    serviceId: null,
    description: "",
    quantity: 1,
    unitPriceCents: 0,
    discountCents: 0,
  };
}

export function DocumentLineItemsEditor({
  items,
  onChange,
  services,
  label = "Line Items",
  minItems = 1,
}: Props) {
  const addItem = useCallback(() => {
    const newItem = createEmptyLineItem("CUSTOM");
    onChange([...items, newItem]);
  }, [items, onChange]);

  const removeItem = useCallback(
    (key: string) => {
      if (items.length <= minItems) return;
      onChange(items.filter((i) => i._key !== key));
    },
    [items, onChange, minItems],
  );

  const updateItem = useCallback(
    (key: string, field: keyof EditorLineItem, value: unknown) => {
      onChange(
        items.map((item) => {
          if (item._key !== key) return item;
          return { ...item, [field]: value };
        }),
      );
    },
    [items, onChange],
  );

  const handleServiceSelect = useCallback(
    (key: string, serviceId: string) => {
      const service = services.find((s) => s.id === serviceId);
      onChange(
        items.map((item) => {
          if (item._key !== key) return item;
          return {
            ...item,
            itemType: serviceId ? "SERVICE" : "CUSTOM",
            serviceId: serviceId || null,
            description: service?.name ?? item.description,
            unitPriceCents: service?.priceCents ?? item.unitPriceCents,
          };
        }),
      );
    },
    [items, services, onChange],
  );

  const totals = useMemo(() => {
    const subtotalCents = items.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0);
    const totalDiscountCents = items.reduce((s, i) => s + i.discountCents, 0);
    const totalCents = subtotalCents - totalDiscountCents;
    return { subtotalCents, totalDiscountCents, totalCents };
  }, [items]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{label}</h2>
        <button
          type="button"
          onClick={addItem}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold transition-colors hover:bg-surface-muted"
        >
          <Plus className="h-4 w-4" />
          Add line item
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl bg-surface-muted p-4 text-sm text-muted-foreground">
          No line items yet. Click &ldquo;Add line item&rdquo; to add one.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const calculated = calculateLineItem(item);

            return (
              <div
                key={item._key}
                className="rounded-xl border border-border bg-background p-4"
              >
                <input type="hidden" name={`item_type_${index}`} value={item.itemType} />
                <input type="hidden" name={`service_id_${index}`} value={item.serviceId ?? ""} />
                <input type="hidden" name={`description_${index}`} value={item.description} />
                <input type="hidden" name={`quantity_${index}`} value={item.quantity} />
                <input type="hidden" name={`unit_price_${index}`} value={(item.unitPriceCents / 100).toFixed(2)} />
                <input type="hidden" name={`discount_${index}`} value={(item.discountCents / 100).toFixed(2)} />

                <div className="flex flex-wrap items-end gap-3">
                  {/* Item type & service selector */}
                  <div className="flex-1 min-w-[160px]">
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                      Item Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.itemType !== "SERVICE") {
                            updateItem(item._key, "itemType", "SERVICE");
                          }
                        }}
                        className={`flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
                          item.itemType === "SERVICE"
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface text-muted-foreground hover:bg-surface-muted"
                        }`}
                      >
                        Service
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.itemType !== "CUSTOM") {
                            updateItem(item._key, "itemType", "CUSTOM");
                            updateItem(item._key, "serviceId", null);
                          }
                        }}
                        className={`flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
                          item.itemType === "CUSTOM"
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface text-muted-foreground hover:bg-surface-muted"
                        }`}
                      >
                        Custom Item
                      </button>
                    </div>
                  </div>

                  {/* Service selector (only when SERVICE type) */}
                  {item.itemType === "SERVICE" ? (
                    <div className="flex-[2] min-w-[180px]">
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                        Service *
                      </label>
                      <Select
                        value={item.serviceId ?? ""}
                        onChange={(val) => handleServiceSelect(item._key, val)}
                        options={[
                          { value: "", label: "Select a service..." },
                          ...services.map((s) => ({
                            value: s.id,
                            label: `${s.name} (${fmtCents(s.priceCents)})`,
                          })),
                        ]}
                        placeholder="Select a service..."
                      />
                    </div>
                  ) : null}

                  {/* Description */}
                  <div className="flex-[2] min-w-[160px]">
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                      {item.itemType === "CUSTOM" ? "Item Name *" : "Description"}
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item._key, "description", e.target.value)}
                      required={item.itemType === "CUSTOM"}
                      placeholder={item.itemType === "CUSTOM" ? "e.g. Vitamin D Supplement" : item.description || "Description"}
                      className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-20">
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Qty *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item._key, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="w-28">
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Unit Price *</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">N$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={(item.unitPriceCents / 100).toFixed(2)}
                        onChange={(e) => updateItem(item._key, "unitPriceCents", Math.round((parseFloat(e.target.value) || 0) * 100))}
                        className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="w-28">
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Discount (N$)</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">N$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={(item.discountCents / 100).toFixed(2)}
                        onChange={(e) => updateItem(item._key, "discountCents", Math.round((parseFloat(e.target.value) || 0) * 100))}
                        className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* Row total */}
                  <div className="w-24 text-right">
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Total</label>
                    <p className="h-11 flex items-center justify-end text-sm font-semibold text-foreground">
                      {fmtCents(calculated.lineTotalCents)}
                    </p>
                  </div>

                  {/* Remove */}
                  {items.length > minItems && (
                    <button
                      type="button"
                      onClick={() => removeItem(item._key)}
                      className="h-11 px-2 text-red-600 hover:text-red-700 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Totals Summary */}
      <DocumentTotalsSummary
        subtotalCents={totals.subtotalCents}
        totalDiscountCents={totals.totalDiscountCents}
        totalCents={totals.totalCents}
      />
    </div>
  );
}

// ─── Totals Summary ────────────────────────────────────────────────────

interface TotalsSummaryProps {
  subtotalCents: number;
  totalDiscountCents: number;
  totalCents: number;
  amountPaidCents?: number;
  balanceCents?: number;
  documentType?: "invoice" | "quotation" | "receipt";
}

export function DocumentTotalsSummary({
  subtotalCents,
  totalDiscountCents,
  totalCents,
  amountPaidCents,
  balanceCents,
}: TotalsSummaryProps) {
  return (
    <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 rounded-xl border border-border bg-surface-muted/50 p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">{fmtCents(subtotalCents)}</span>
      </div>
      {totalDiscountCents > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Discount</span>
          <span className="font-medium text-red-600">-{fmtCents(totalDiscountCents)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-border pt-1.5">
        <span className="font-semibold">Total</span>
        <span className="font-semibold">{fmtCents(totalCents)}</span>
      </div>
      {amountPaidCents !== undefined && amountPaidCents > 0 && (
        <div className="flex justify-between text-success">
          <span>Amount Paid</span>
          <span>-{fmtCents(amountPaidCents)}</span>
        </div>
      )}
      {balanceCents !== undefined && balanceCents > 0 && (
        <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
          <span>Balance Due</span>
          <span>{fmtCents(balanceCents)}</span>
        </div>
      )}
    </div>
  );
}
