"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FilePlus2 } from "lucide-react";
import { Button, Card, DatePicker, Input, Label, Select } from "@/ui/components";
import { fmtCents } from "@/documents/calculate";

type DocumentType = "quotation" | "invoice" | "receipt";

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
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
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
  const [manualDescription, setManualDescription] = useState("Manual receipt");
  const [manualAmount, setManualAmount] = useState("");
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
    if (!bookingId) {
      return;
    }
    let cancelled = false;
    fetch(`/api/bookings?bookingId=${encodeURIComponent(bookingId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load booking charges."))))
      .then((data) => {
        if (cancelled) return;
        setClientId(data.booking.clientId);
        setLineItems(data.lineItems ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        if (!cancelled) setLoadingCharges(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const effectiveLineItems = useMemo(() => {
    if (manualEntry) {
      const cents = Math.round((Number.parseFloat(manualAmount) || 0) * 100);
      return cents > 0
        ? [{ description: manualDescription.trim() || "Manual receipt", quantity: 1, unitPriceCents: cents, discountCents: 0 }]
        : [];
    }
    return lineItems;
  }, [lineItems, manualAmount, manualDescription, manualEntry]);

  const totalCents = effectiveLineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents - item.discountCents, 0);

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
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
          lineItems: effectiveLineItems,
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
          <p className="mt-1 text-sm text-muted-foreground">Create a quotation, invoice, or receipt from booking charges.</p>
        </div>
        <FilePlus2 className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div>
          <Label htmlFor="documentType" className="mb-2">Type</Label>
          <Select
            id="documentType"
            value={documentType}
            onChange={(value) => setDocumentType(value as DocumentType)}
            options={[
              { value: "quotation", label: "Quotation" },
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

      <label className="mt-4 flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={manualEntry}
          onChange={(event) => {
            setManualEntry(event.target.checked);
            if (event.target.checked) {
              setBookingId("");
              setLineItems([]);
              setDocumentType("receipt");
            }
          }}
          className="h-4 w-4 accent-primary"
        />
        Manual receipt without a booking
      </label>

      {manualEntry ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div>
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
          <div>
            <Label htmlFor="manualDescription" className="mb-2">Description</Label>
            <Input id="manualDescription" value={manualDescription} onChange={(event) => setManualDescription(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="manualAmount" className="mb-2">Amount (N$)</Label>
            <Input id="manualAmount" type="number" min="0.01" step="0.01" value={manualAmount} onChange={(event) => setManualAmount(event.target.value)} />
          </div>
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

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Line Item</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Unit</th>
              <th className="px-4 py-3 text-right">Discount</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loadingCharges ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading charges...</td></tr>
            ) : effectiveLineItems.length > 0 ? (
              effectiveLineItems.map((item, index) => (
                <tr key={`${item.description}-${index}`} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{item.description}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{fmtCents(item.unitPriceCents)}</td>
                  <td className="px-4 py-3 text-right">{fmtCents(item.discountCents)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtCents(item.quantity * item.unitPriceCents - item.discountCents)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Select a booking to load charges.</td></tr>
            )}
          </tbody>
          <tfoot className="border-t border-border bg-surface-muted">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right font-semibold">Total</td>
              <td className="px-4 py-3 text-right font-semibold">{fmtCents(totalCents)}</td>
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
