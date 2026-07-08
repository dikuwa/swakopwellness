"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CreditCard } from "lucide-react";
import { Button, Card, Input, Label, Select } from "@/ui/components";

interface PaymentPanelProps {
  bookingId?: string | null;
  invoiceId?: string | null;
  clientId?: string | null;
}

interface BookingOption {
  id: string;
  reference: string;
  clientName: string;
  serviceName: string;
}

export function PaymentPanel({ bookingId, invoiceId, clientId }: PaymentPanelProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState(bookingId ?? "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const hasContext = !!selectedBookingId || !!invoiceId || !!clientId;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bookings?status=active")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load bookings."))))
      .then((data) => {
        if (!cancelled) setBookings(data.bookings ?? []);
      })
      .catch((err) => setMessage(err.message))
      .finally(() => {
        if (!cancelled) setLoadingBookings(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBookingId || null,
          invoiceId,
          clientId,
          method,
          amount,
          reference,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not record payment.");
      const receipt = data.payment.receiptNumber ? ` Receipt ${data.payment.receiptNumber} was generated.` : "";
      setMessage(`Payment recorded.${receipt}`);
      setAmount("");
      setReference("");
      toast.success("Payment recorded");
      router.refresh();
    } catch (err) {
      const error = err instanceof Error ? err.message : "Could not record payment.";
      setMessage(error);
      toast.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Record Payment</h2>
          <p className="mt-1 text-sm text-muted-foreground">Payments update linked invoice balances and create a receipt once paid in full.</p>
        </div>
        <CreditCard className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      <div className="mt-6 grid gap-4">
        <div>
          <Label htmlFor="paymentBooking" className="mb-2">Booking</Label>
          <Select
            id="paymentBooking"
            value={selectedBookingId}
            onChange={setSelectedBookingId}
            searchable
            showClear
            disabled={loadingBookings || !!invoiceId}
            placeholder={invoiceId ? "Using selected invoice" : loadingBookings ? "Loading bookings..." : "Select booking"}
            options={bookings.map((booking) => ({
              value: booking.id,
              label: `${booking.reference} - ${booking.clientName} - ${booking.serviceName}`,
            }))}
          />
        </div>
        <div>
          <Label htmlFor="paymentAmount" className="mb-2">Amount (N$)</Label>
          <Input id="paymentAmount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="paymentMethod" className="mb-2">Method</Label>
          <Select
            id="paymentMethod"
            value={method}
            onChange={setMethod}
            options={[
              { value: "cash", label: "Cash" },
              { value: "card", label: "Card" },
              { value: "eft", label: "Bank Transfer / EFT" },
              { value: "mobile", label: "Mobile Payment" },
              { value: "other", label: "Other" },
            ]}
          />
        </div>
        <div>
          <Label htmlFor="paymentReference" className="mb-2">Reference</Label>
          <Input id="paymentReference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional reference" />
        </div>
      </div>

      {message ? (
        <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${message.includes("recorded") ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
          {message}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!hasContext ? (
          <p className="text-sm text-muted-foreground">Select a booking or choose Pay on an unpaid invoice.</p>
        ) : <span />}
        <Button type="button" onClick={submit} disabled={submitting || !amount || !hasContext}>
          {submitting ? "Recording..." : "Record Payment"}
        </Button>
      </div>
    </Card>
  );
}
