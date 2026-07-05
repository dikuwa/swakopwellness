"use client";

import { useState } from "react";
import { DatePicker, TimePicker, Select } from "@/ui/components";
import { useActionState } from "react";
import toast from "react-hot-toast";
import { createFollowUp } from "@/followups/actions";

interface FollowUpFormProps {
  clients: Array<{ id: string; fullName: string }>;
  bookingOptions: Array<{ id: string; reference: string; clientName: string; serviceName: string }>;
}

export function FollowUpForm({ clients, bookingOptions }: FollowUpFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => createFollowUp(formData),
    null as { ok: true } | { ok: false; error: string } | null
  );

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.fullName,
  }));

  const bookingOptionsFormatted = bookingOptions.map((booking) => ({
    value: booking.id,
    label: `${booking.reference} - ${booking.clientName} - ${booking.serviceName}`,
  }));

  const methodOptions = [
    { value: "phone", label: "Phone" },
    { value: "email", label: "Email" },
    { value: "in_person", label: "In person" },
    { value: "other", label: "Other" },
  ];

  return (
    <form action={formAction} className="mt-8 rounded-2xl border border-border bg-background p-4">
      <h2 className="text-lg font-semibold">Create Follow-up</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="clientId" className="mb-1.5 block text-sm font-semibold">Client *</label>
          <Select
            id="clientId"
            name="clientId"
            required
            options={clientOptions}
            placeholder="Select a client"
            searchable
          />
        </div>
        <div>
          <label htmlFor="bookingId" className="mb-1.5 block text-sm font-semibold">Booking</label>
          <Select
            id="bookingId"
            name="bookingId"
            options={bookingOptionsFormatted}
            placeholder="No booking linked"
            searchable
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="mb-1.5 block text-sm font-semibold">Due date *</label>
          <DatePicker
            id="dueDate"
            name="dueDate"
            required
            placeholder="Select date"
            minDate={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div>
          <label htmlFor="dueTime" className="mb-1.5 block text-sm font-semibold">Due time *</label>
          <TimePicker
            id="dueTime"
            name="dueTime"
            required
            placeholder="Select time"
          />
        </div>
        <div>
          <label htmlFor="method" className="mb-1.5 block text-sm font-semibold">Method *</label>
          <Select
            id="method"
            name="method"
            required
            options={methodOptions}
            placeholder="Select a method"
          />
        </div>
        <div>
          <label htmlFor="internalNote" className="mb-1.5 block text-sm font-semibold">Internal note</label>
          <input id="internalNote" name="internalNote" type="text" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
        </div>
      </div>
      <button type="submit" disabled={isPending} className="mt-4 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">
        {isPending ? "Creating..." : "Create follow-up"}
      </button>
    </form>
  );
}