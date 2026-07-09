"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { Select } from "@/ui/components";
import { fmtCents } from "@/documents/calculate";
import {
  createDocumentPredefinedItem,
  deleteDocumentPredefinedItem,
  updateDocumentPredefinedItem,
} from "@/settings/actions";

type PredefinedItem = {
  id: string;
  label: string;
  description: string;
  itemType: string;
  unitPriceCents: number;
  sortOrder: number;
  active: boolean;
};

const PREDEFINED_ITEM_TYPE_OPTIONS = [
  { value: "service", label: "Service" },
  { value: "product", label: "Product" },
  { value: "fee", label: "Fee" },
  { value: "discount", label: "Discount" },
  { value: "other", label: "Other" },
];

export function DocumentPredefinedItemsManager({ predefinedItems }: { predefinedItems: PredefinedItem[] }) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const newPresetFormRef = useRef<HTMLFormElement>(null);

  const handleAction = async (
    action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>,
    formData: FormData,
    label: string,
    successMessage: string,
    onSuccess?: () => void,
  ) => {
    setSaving(label);
    setError(null);
    setSuccess(null);
    const result = await action(formData);
    if (!result.ok) {
      setError(result.error ?? "Save failed");
    } else {
      setSuccess(successMessage);
      onSuccess?.();
    }
    setSaving(null);
  };

  return (
    <section className="rounded-xl border border-border bg-background p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">Document presets</p>
          <h2 className="mt-1 text-lg font-semibold">Additional item presets</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage the reusable charges shown in the Documents page “Select predefined item” dropdown. Active items appear for invoices, quotations, and receipts.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-muted-foreground">
          {predefinedItems.length} saved
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {success}
        </div>
      )}

      <form
        ref={newPresetFormRef}
        action={async (fd) => handleAction(
          createDocumentPredefinedItem,
          fd,
          "preset-new",
          "Predefined item added.",
          () => newPresetFormRef.current?.reset(),
        )}
        className="mt-5 rounded-xl border border-border bg-surface-muted p-4"
      >
        <h3 className="text-sm font-semibold">Add a predefined item</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(170px,1fr)_minmax(190px,1.3fr)_150px_130px_100px_90px]">
          <div>
            <label htmlFor="preset-new-label" className="mb-1.5 block text-sm font-medium">Item name</label>
            <input id="preset-new-label" name="label" placeholder="e.g. Admin fee" required className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="preset-new-description" className="mb-1.5 block text-sm font-medium">Description</label>
            <input id="preset-new-description" name="description" placeholder="Shown on document line" className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Type</label>
            <Select name="itemType" value="other" options={PREDEFINED_ITEM_TYPE_OPTIONS} />
          </div>
          <div>
            <label htmlFor="preset-new-price" className="mb-1.5 block text-sm font-medium">Price</label>
            <input id="preset-new-price" name="unitPrice" type="number" min="0" step="0.01" placeholder="0.00" className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="preset-new-order" className="mb-1.5 block text-sm font-medium">Order</label>
            <input id="preset-new-order" name="sortOrder" type="number" min="0" step="1" placeholder="0" className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
          </div>
          <label className="flex h-full min-h-11 items-end gap-2 pb-3 text-sm font-medium lg:justify-center">
            <input type="checkbox" name="active" defaultChecked className="h-4 w-4 rounded border-border accent-primary" />
            Active
          </label>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={saving === "preset-new"}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving === "preset-new" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
            {saving === "preset-new" ? "Adding..." : "Add item"}
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {predefinedItems.length > 0 ? (
          <div className="hidden grid-cols-[minmax(170px,1fr)_minmax(190px,1.3fr)_150px_130px_100px_90px_116px] gap-4 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground lg:grid">
            <span>Item name</span>
            <span>Description</span>
            <span>Type</span>
            <span>Price</span>
            <span>Order</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
        ) : null}
        {predefinedItems.map((item) => (
          <form
            key={item.id}
            action={async (fd) => handleAction(updateDocumentPredefinedItem, fd, `preset-${item.id}`, "Predefined item updated.")}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <input type="hidden" name="id" value={item.id} />
            <div className="grid gap-4 lg:grid-cols-[minmax(170px,1fr)_minmax(190px,1.3fr)_150px_130px_100px_90px_116px] lg:items-end">
              <div>
                <label htmlFor={`preset-label-${item.id}`} className="mb-1.5 block text-sm font-medium lg:sr-only">Item name</label>
                <input id={`preset-label-${item.id}`} name="label" defaultValue={item.label} required className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label htmlFor={`preset-description-${item.id}`} className="mb-1.5 block text-sm font-medium lg:sr-only">Description</label>
                <input id={`preset-description-${item.id}`} name="description" defaultValue={item.description} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium lg:sr-only">Type</label>
                <Select name="itemType" value={item.itemType} options={PREDEFINED_ITEM_TYPE_OPTIONS} />
              </div>
              <div>
                <label htmlFor={`preset-price-${item.id}`} className="mb-1.5 block text-sm font-medium lg:sr-only">Price</label>
                <input id={`preset-price-${item.id}`} name="unitPrice" type="number" min="0" step="0.01" defaultValue={(item.unitPriceCents / 100).toFixed(2)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </div>
              <div>
                <label htmlFor={`preset-order-${item.id}`} className="mb-1.5 block text-sm font-medium lg:sr-only">Order</label>
                <input id={`preset-order-${item.id}`} name="sortOrder" type="number" min="0" step="1" defaultValue={item.sortOrder} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </div>
              <label className="flex h-11 items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="active" defaultChecked={item.active} className="h-4 w-4 rounded border-border accent-primary" />
                Active
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving === `preset-${item.id}`}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving === `preset-${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {saving === `preset-${item.id}` ? "Saving" : "Save"}
                </button>
                <button
                  type="submit"
                  formNoValidate
                  formAction={async (fd) => handleAction(deleteDocumentPredefinedItem, fd, `preset-delete-${item.id}`, "Predefined item deleted.")}
                  disabled={saving === `preset-delete-${item.id}`}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-destructive disabled:opacity-50"
                  aria-label={`Delete ${item.label}`}
                  title={`Delete ${item.label}`}
                >
                  {saving === `preset-delete-${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Dropdown preview: {item.label} - {fmtCents(item.unitPriceCents)}</p>
          </form>
        ))}
        {predefinedItems.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">No predefined items yet. Add the first one above to make it available on generated documents.</p>
        ) : null}
      </div>
    </section>
  );
}
