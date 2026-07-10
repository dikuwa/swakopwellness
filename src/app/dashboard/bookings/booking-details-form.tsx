"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { updateBookingDetails } from "@/booking/actions";
import { toBusinessDateValue, toBusinessTimeValue } from "@/lib/business-time";
import { Button, DatePicker, Input, Label, Select, Textarea, TimePicker } from "@/ui/components";

type ActionState = { ok: boolean; error?: string } | null;

function dateValue(date: Date | null) {
  return toBusinessDateValue(date);
}

function timeValue(date: Date | null) {
  return toBusinessTimeValue(date);
}

export function BookingDetailsForm({
  booking,
  services,
}: {
  booking: {
    id: string;
    serviceId: string | null;
    preferredAt: Date;
    alternativeAt: Date | null;
    preferredContactMethod: string;
    clientType: string;
    note: string | null;
    status: string;
  };
  services: Array<{ id: string; name: string; priceCents: number; durationMinutes: number | null }>;
}) {
  const [serviceId, setServiceId] = useState(booking.serviceId ?? "");
  const [preferredDate, setPreferredDate] = useState<string | undefined>(dateValue(booking.preferredAt));
  const [preferredTime, setPreferredTime] = useState<string | undefined>(timeValue(booking.preferredAt));
  const [alternativeDate, setAlternativeDate] = useState<string | undefined>(dateValue(booking.alternativeAt));
  const [alternativeTime, setAlternativeTime] = useState<string | undefined>(timeValue(booking.alternativeAt));
  const [contactMethod, setContactMethod] = useState(booking.preferredContactMethod);
  const [clientType, setClientType] = useState(booking.clientType);
  const [note, setNote] = useState(booking.note ?? "");
  const [reason, setReason] = useState("");

  const [state, formAction, isPending] = useActionState(async (_previous: ActionState, formData: FormData) => {
    try {
      await updateBookingDetails(formData);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Could not update booking." };
    }
  }, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Booking updated");
    } else if (state?.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const locked = ["completed", "cancelled", "no_show"].includes(booking.status);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="bookingId" value={booking.id} />

      {state?.ok === false ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {state.error}
        </div>
      ) : null}

      {locked ? (
        <p className="rounded-xl bg-surface-muted p-4 text-sm text-muted-foreground">
          This booking is terminal. Completed, cancelled, and no-show bookings are kept locked for history.
        </p>
      ) : null}

      <div>
        <Label htmlFor="edit-service">Service</Label>
        <Select
          id="edit-service"
          name="serviceId"
          required
          disabled={locked}
          value={serviceId}
          onChange={setServiceId}
          searchable
          options={services.map((service) => ({
            value: service.id,
            label: `${service.name} - N$${(service.priceCents / 100).toFixed(2)}${service.durationMinutes ? ` · ${service.durationMinutes} min` : ""}`,
          }))}
          placeholder="Choose a service"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="edit-preferred-date">Preferred date</Label>
          <DatePicker id="edit-preferred-date" name="preferredDate" required disabled={locked} value={preferredDate} onChange={setPreferredDate} minDate={new Date().toISOString().split("T")[0]} />
        </div>
        <div>
          <Label htmlFor="edit-preferred-time">Preferred time</Label>
          <TimePicker id="edit-preferred-time" name="preferredTime" required disabled={locked} value={preferredTime} onChange={setPreferredTime} />
        </div>
        <div>
          <Label htmlFor="edit-alternative-date">Alternative date</Label>
          <DatePicker id="edit-alternative-date" name="alternativeDate" disabled={locked} value={alternativeDate} onChange={setAlternativeDate} showClear minDate={new Date().toISOString().split("T")[0]} />
        </div>
        <div>
          <Label htmlFor="edit-alternative-time">Alternative time</Label>
          <TimePicker id="edit-alternative-time" name="alternativeTime" disabled={locked} value={alternativeTime} onChange={setAlternativeTime} showClear />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="edit-contact">Preferred contact</Label>
          <Select
            id="edit-contact"
            name="preferredContactMethod"
            disabled={locked}
            value={contactMethod}
            onChange={setContactMethod}
            options={[
              { value: "phone", label: "Phone" },
              { value: "email", label: "Email" },
              { value: "whatsapp", label: "WhatsApp" },
            ]}
          />
        </div>
        <div>
          <Label htmlFor="edit-client-type">Client type</Label>
          <Select
            id="edit-client-type"
            name="clientType"
            disabled={locked}
            value={clientType}
            onChange={setClientType}
            options={[
              { value: "new", label: "New" },
              { value: "returning", label: "Returning" },
            ]}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="edit-note">Internal/request note</Label>
        <Textarea id="edit-note" name="note" disabled={locked} value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
      </div>

      <div>
        <Label htmlFor="edit-reason">Reason for change</Label>
        <Input id="edit-reason" name="reason" disabled={locked} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Client requested another time, assigned another service..." />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || locked} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {isPending ? "Saving..." : "Save booking details"}
        </Button>
      </div>
    </form>
  );
}
