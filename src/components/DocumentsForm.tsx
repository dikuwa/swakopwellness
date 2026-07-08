"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FilePlus2, Plus, Trash2 } from "lucide-react";
import { Button, Card, DatePicker, Input, Label, Select } from "@/ui/components";
import { fmtCents } from "@/documents/calculate";

type DocumentType = "quotation" | "invoice" | "receipt";
type LineItemType = "service" | "product" | "fee" | "discount" | "other";

interface ClientOption {
  id: string;
  fullName: string;
}

interface BookingOption {
  id: string;
  reference: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  servicePriceCents: number;
  preferredAt: string;
}

interface LineItem {
  key: string;
  serviceId?: string | null;
  description: string;
  itemType: LineItemType;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  source: "booking" | "predefined" | "custom";
}

const predefinedItems: Array<{ value: string; label: string; description: string; itemType: LineItemType; unitPriceCents: number }> = [
  { value: "consultation_add_on", label: "Consultation add-on", description: "Consultation add-on", itemType: "service", unitPriceCents: 25000 },
  { value: "supplement", label: "Supplement", description: "Supplement", itemType: "product", unitPriceCents: 18000 },
  { value: "transport", label: "Transport", description: "Transport", itemType: "fee", unitPriceCents: 15000 },
  { value: "admin_fee", label: "Admin fee", description: "Admin fee", itemType: "fee", unitPriceCents: 10000 },
  { value: "late_cancellation", label: "Late cancellation", description: "Late cancellation", itemType: "fee", unitPriceCents: 20000 },
  { value: "custom_wellness_support", label: "Custom wellness support", description: "Custom wellness support", itemType: "other", unitPriceCents: 30000 },
];

function newKey(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function centsFromInput(value: string) {
  return Math.round((Number.parseFloat(value) || 0) * 100);
}

function centsToInput(cents: number) {
  return (cents / 100).toFixed(2);
}

function normaliseLineItem(item: Omit<LineItem, "key">): LineItem {
  return { ...item, key: newKey(item.source) };
}

export function DocumentsForm({ clients, initialType = "quotation" }: { clients: ClientOption[]; initialType?: DocumentType }) {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [clientId, setClientId] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>(initialType);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [manualEntry, setManualEntry] = useState(false);
  const [selectedPredefined, setSelectedPredefined] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bookings?status=active")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load bookings."))))
      .then((data) => {
        if (!cancelled) setBookings(data.bookings ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        if (!cancelled) setLoadingBookings(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    fetch(`/api/bookings?bookingId=${encodeURIComponent(bookingId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load booking charges."))))
      .then((data) => {
        if (cancelled) return;
        setClientId(data.booking.clientId);
        setLineItems((data.lineItems ?? []).map((item: { serviceId?: string | null; description: string; quantity: number; unitPriceCents: number; discountCents?: number }) =>
          normaliseLineItem({
            serviceId: item.serviceId ?? null,
            description: item.description,
            itemType: "service",
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            discountCents: item.discountCents ?? 0,
            source: "booking",
          }),
        ));
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        if (!cancelled) setLoadingCharges(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const validLineItems = useMemo(
    () => lineItems.filter((item) => item.description.trim() && item.quantity > 0 && item.unitPriceCents >= 0),
    [lineItems],
  );

  const bookingTotalCents = validLineItems
    .filter((item) => item.source === "booking")
    .reduce((sum, item) => sum + Math.max(0, item.quantity * item.unitPriceCents - item.discountCents), 0);
  const additionalTotalCents = validLineItems
    .filter((item) => item.source !== "booking")
    .reduce((sum, item) => sum + Math.max(0, item.quantity * item.unitPriceCents - item.discountCents), 0);
  const discountCents = validLineItems.reduce((sum, item) => sum + item.discountCents, 0);
  const totalCents = bookingTotalCents + additionalTotalCents;

  function updateItem(key: string, patch: Partial<LineItem>) {
    setLineItems((items) => items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeItem(key: string) {
    setLineItems((items) => items.filter((item) => item.key !== key));
  }

  function addPredefinedItem(value: string) {
    setSelectedPredefined(value);
    const preset = predefinedItems.find((item) => item.value === value);
    if (!preset) return;
    setLineItems((items) => [
      ...items,
      normaliseLineItem({
        serviceId: null,
        description: preset.description,
        itemType: preset.itemType,
        quantity: 1,
        unitPriceCents: preset.unitPriceCents,
        discountCents: 0,
        source: "predefined",
      }),
    ]);
    window.setTimeout(() => setSelectedPredefined(""), 0);
  }

  function addCustomItem() {
    setLineItems((items) => [
      ...items,
      normaliseLineItem({
        serviceId: null,
        description: "",
        itemType: "other",
        quantity: 1,
        unitPriceCents: 0,
        discountCents: 0,
        source: "custom",
      }),
    ]);
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      if (!manualEntry && !bookingId) throw new Error("Select a booking before generating this document.");
      if (!clientId) throw new Error("Select a client before generating this document.");
      if (validLineItems.length < 1) throw new Error("Add at least one valid line item.");

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: manualEntry ? null : bookingId,
          clientId,
          type: documentType,
          issueDate,
          validUntil: documentType === "quotation" ? validUntil : null,
          dueDate: documentType === "invoice" ? dueDate : null,
          manualEntry,
          lineItems: validLineItems.map((item) => ({
            serviceId: item.serviceId ?? null,
            description: item.description.trim(),
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            discountCents: Math.min(item.discountCents, item.quantity * item.unitPriceCents),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate document.");
      toast.success(`${data.document.documentNumber} generated`);
      router.push("/dashboard/documents");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not generate document.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Generate Document</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create a document using booking charges or add custom items.</p>
        </div>
        <FilePlus2 className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div>
          <Label htmlFor="documentType" className="mb-2">Document Type</Label>
          <Select
            id="documentType"
            value={documentType}
            onChange={(value) => {
              const nextType = value as DocumentType;
              setDocumentType(nextType);
              if (nextType !== "receipt") setManualEntry(false);
            }}
            options={[
              { value: "quotation", label: "Quote" },
              { value: "invoice", label: "Invoice" },
              { value: "receipt", label: "Receipt" },
            ]}
          />
        </div>
        <div>
          <Label htmlFor="bookingId" className="mb-2">Booking</Label>
          <Select
            id="bookingId"
            value={bookingId}
            onChange={(value) => {
              setBookingId(value);
              setManualEntry(false);
              setError("");
              if (value) {
                setLoadingCharges(true);
              } else {
                setLineItems([]);
                setLoadingCharges(false);
              }
            }}
            searchable
            showClear
            disabled={loadingBookings || manualEntry}
            placeholder={loadingBookings ? "Loading bookings..." : "Select booking"}
            options={bookings.map((booking) => ({
              value: booking.id,
              label: `${booking.reference} - ${booking.clientName} - ${booking.serviceName}`,
            }))}
          />
        </div>
        <div>
          <Label htmlFor="issueDate" className="mb-2">Issue Date</Label>
          <DatePicker id="issueDate" value={issueDate} onChange={setIssueDate} placeholder="Select date" />
        </div>
      </div>

      {documentType === "receipt" ? (
        <label className="mt-4 flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={manualEntry}
            onChange={(event) => {
              setManualEntry(event.target.checked);
              if (event.target.checked) {
                setBookingId("");
                setLineItems([]);
              }
            }}
            className="h-4 w-4 accent-primary"
          />
          Manual receipt without a booking
        </label>
      ) : null}

      {manualEntry ? (
        <div className="mt-4 max-w-md">
          <Label htmlFor="clientId" className="mb-2">Client</Label>
          <Select
            id="clientId"
            value={clientId}
            onChange={setClientId}
            searchable
            options={clients.map((client) => ({ value: client.id, label: client.fullName }))}
            placeholder="Select client"
          />
        </div>
      ) : null}

      {documentType === "quotation" ? (
        <div className="mt-4 max-w-sm">
          <Label htmlFor="validUntil" className="mb-2">Valid Until</Label>
          <DatePicker id="validUntil" value={validUntil} onChange={setValidUntil} placeholder="Select date" />
        </div>
      ) : null}

      {documentType === "invoice" ? (
        <div className="mt-4 max-w-sm">
          <Label htmlFor="dueDate" className="mb-2">Due Date</Label>
          <DatePicker id="dueDate" value={dueDate} onChange={setDueDate} placeholder="Select date" />
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-border bg-surface-muted p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Additional Items</h3>
            <p className="mt-1 text-xs text-muted-foreground">Add predefined charges or custom document rows.</p>
          </div>
          <div className="flex flex-col gap-2 sm:w-[420px] sm:flex-row">
            <Select
              value={selectedPredefined}
              onChange={addPredefinedItem}
              options={predefinedItems.map((item) => ({ value: item.value, label: `${item.label} - ${fmtCents(item.unitPriceCents)}` }))}
              placeholder="Select predefined item"
              showClear
            />
            <Button type="button" variant="secondary" onClick={addCustomItem} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Custom item
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Line Item</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-right">Discount</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Remove</th>
            </tr>
          </thead>
          <tbody>
            {loadingCharges ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Loading booking charges...</td></tr>
            ) : lineItems.length > 0 ? (
              lineItems.map((item) => {
                const rowTotal = Math.max(0, item.quantity * item.unitPriceCents - item.discountCents);
                return (
                  <tr key={item.key} className="border-t border-border align-top">
                    <td className="px-3 py-3">
                      <Input
                        value={item.description}
                        onChange={(event) => updateItem(item.key, { description: event.target.value })}
                        placeholder="Description"
                        className="h-10"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Select
                        value={item.itemType}
                        onChange={(value) => updateItem(item.key, { itemType: value as LineItemType })}
                        options={[
                          { value: "service", label: "Service" },
                          { value: "product", label: "Product" },
                          { value: "fee", label: "Fee" },
                          { value: "discount", label: "Discount" },
                          { value: "other", label: "Other" },
                        ]}
                        className="h-10"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={String(item.quantity)}
                        onChange={(event) => updateItem(item.key, { quantity: Math.max(1, Number.parseInt(event.target.value, 10) || 1) })}
                        className="h-10 text-right"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={centsToInput(item.unitPriceCents)}
                        onChange={(event) => updateItem(item.key, { unitPriceCents: centsFromInput(event.target.value) })}
                        className="h-10 text-right"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={centsToInput(item.discountCents)}
                        onChange={(event) => updateItem(item.key, { discountCents: Math.min(centsFromInput(event.target.value), item.quantity * item.unitPriceCents) })}
                        className="h-10 text-right"
                      />
                    </td>
                    <td className="px-4 py-5 text-right font-semibold">{fmtCents(rowTotal)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-destructive"
                        aria-label={`Remove ${item.description || "line item"}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  Select a booking to load charges or add a custom item.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t border-border bg-surface-muted">
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right text-muted-foreground">Booking total</td>
              <td className="px-4 py-2 text-right font-medium">{fmtCents(bookingTotalCents)}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right text-muted-foreground">Additional charges</td>
              <td className="px-4 py-2 text-right font-medium">{fmtCents(additionalTotalCents)}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right text-muted-foreground">Discounts</td>
              <td className="px-4 py-2 text-right font-medium">{fmtCents(discountCents)}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right font-semibold">Document total</td>
              <td className="px-4 py-3 text-right font-semibold">{fmtCents(totalCents)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-6 flex justify-end">
        <Button type="button" onClick={submit} disabled={submitting || totalCents <= 0 || !clientId}>
          {submitting ? "Generating..." : "Generate"}
        </Button>
      </div>
    </Card>
  );
}
