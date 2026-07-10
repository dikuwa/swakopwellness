"use client";

import { useState, useActionState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { DatePicker, Select, Textarea, TimePicker } from "@/ui/components";
import type { SelectOption } from "@/ui/select";
import { createFollowUp } from "@/followups/actions";
import { formatBusinessDateTime } from "@/lib/business-time";
import { Loader2 } from "lucide-react";

type ClientOption = { value: string; label: string };
type BookingOption = { id: string; reference: string; clientId: string; serviceName: string; preferredAt: Date; clientName: string | null };

interface FollowUpFormProps {
  clients: ClientOption[];
  bookingOptions: BookingOption[];
}

export function FollowUpForm({ clients, bookingOptions }: FollowUpFormProps) {
  const [state, formAction, isPending] = useActionState(createFollowUp, null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [clientId, setClientId] = useState(searchParams.get("clientId") ?? "");
  const [bookingId, setBookingId] = useState(searchParams.get("bookingId") ?? "");
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [dueTime, setDueTime] = useState<string | undefined>();
  const [method, setMethod] = useState("phone");
  const [internalNote, setInternalNote] = useState("");

  // When client changes, clear the selected booking if it doesn't belong to the new client
  useEffect(() => {
    const selectedBooking = bookingOptions.find(b => b.id === bookingId);
    if (selectedBooking && selectedBooking.clientId !== clientId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookingId("");
    }
  }, [clientId, bookingId, bookingOptions]);
  
  useEffect(() => {
    if (state?.success) {
      toast.success("Follow-up created successfully!");
      router.refresh(); // Refresh the page to show the new follow-up
      // Clear the form
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClientId("");
      setBookingId("");
      setDueDate(undefined);
      setDueTime(undefined);
      setMethod("phone");
      setInternalNote("");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const filteredBookingOptions = useMemo(() => {
    if (!clientId) return [];
    return bookingOptions
      .filter(b => b.clientId === clientId)
      .map(b => ({
        value: b.id,
        label: `${b.reference} - ${b.serviceName}`, // Keep a simple label for the input display
        ...b, // Pass the whole booking object
      }));
  }, [clientId, bookingOptions]);

  const renderBookingOption = (option: SelectOption) => (
    <div>
      <p className="font-semibold">{option.reference as string}</p>
      <p className="text-xs text-muted-foreground">{option.serviceName as string}</p>
      <p className="text-xs text-muted-foreground">{formatBusinessDateTime(new Date(option.preferredAt as Date))}</p>
    </div>
  );

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-2xl border border-border bg-background p-5">
      <h2 className="text-lg font-semibold">Add New Follow-up</h2>
      {state?.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {state.error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Client</label>
          <Select
            name="clientId"
            options={clients}
            value={clientId}
            onChange={setClientId}
            placeholder="Select a client"
            searchable
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Associated Booking (optional)</label>
          <Select
            name="bookingId"
            options={filteredBookingOptions}
            value={bookingId}
            onChange={setBookingId}
            placeholder={clientId ? "Select a booking" : "Select a client first"}
            searchable
            disabled={!clientId}
            renderOption={renderBookingOption}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Due Date</label>
          <DatePicker
            name="dueDate"
            value={dueDate}
            onChange={setDueDate}
            required
            minDate={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Due Time</label>
          <TimePicker
            name="dueTime"
            value={dueTime}
            onChange={setDueTime}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Method</label>
          <Select
            name="method"
            options={[
              { value: "phone", label: "Phone Call" },
              { value: "email", label: "Email" },
              { value: "whatsapp", label: "WhatsApp Message" },
              { value: "sms", label: "SMS" },
            ]}
            value={method}
            onChange={setMethod}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Internal Note</label>
          <Textarea
            name="internalNote"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Add a note for the follow-up..."
            required
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Saving..." : "Add Follow-up"}
        </button>
      </div>
    </form>
  );
}
