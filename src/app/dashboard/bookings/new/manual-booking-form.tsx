"use client";

import { useState } from "react";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { DatePicker, TimePicker, Select, RadioButtonGroup } from "@/ui/components";
import { useActionState } from "react";
import toast from "react-hot-toast";
import { createManualBookingAction } from "./actions";

interface ManualBookingFormProps {
  services: Array<{ id: string; name: string; priceCents: number }>;
  questions: Array<{ id: string; question: string }>;
  communication: {
    enableCalls: boolean;
    enableEmailContact: boolean;
    enableWhatsapp: boolean;
    mainPhone: string;
  };
  rules: {
    openingTime: string;
    closingTime: string;
  };
  error?: string;
}

export function ManualBookingForm({
  services,
  questions,
  communication,
  rules,
  error,
}: ManualBookingFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => createManualBookingAction(formData),
    null
  );

  const serviceOptions = services.map((service) => ({
    value: service.id,
    label: `${service.name} - N$${(service.priceCents / 100).toFixed(2)}`,
  }));

  const contactMethodOptions = [
    ...(communication.enableCalls ? [{ value: "phone", label: "Phone", icon: <Phone className="h-4 w-4" /> }] : []),
    ...(communication.enableEmailContact ? [{ value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> }] : []),
    ...(communication.enableWhatsapp ? [{ value: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" /> }] : []),
  ];

  return (
    <form action={formAction} className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
      <section className="space-y-6 rounded-2xl border border-border bg-background p-5 sm:p-6">
        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium md:col-span-2">
            Service
            <Select
              name="serviceId"
              required
              options={serviceOptions}
              placeholder="Choose a service"
            />
          </label>
          <label className="text-sm font-medium">
            Preferred date
            <DatePicker
              name="preferredDate"
              required
              placeholder="Select date"
              minDate={new Date().toISOString().split("T")[0]}
            />
          </label>
          <label className="text-sm font-medium">
            Preferred time
            <TimePicker
              name="preferredTime"
              required
              placeholder="Select time"
              minTime={rules.openingTime}
              maxTime={rules.closingTime}
            />
          </label>
          <label className="text-sm font-medium">
            Alternative date
            <DatePicker
              name="alternativeDate"
              placeholder="Select date (optional)"
              minDate={new Date().toISOString().split("T")[0]}
              showClear
            />
          </label>
          <label className="text-sm font-medium">
            Alternative time
            <TimePicker
              name="alternativeTime"
              placeholder="Select time (optional)"
              minTime={rules.openingTime}
              maxTime={rules.closingTime}
              showClear
            />
          </label>
        </div>

        <div className="grid gap-4 border-t border-border pt-6 md:grid-cols-2">
          <label className="text-sm font-medium md:col-span-2">
            Full name
            <input name="fullName" required className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
          </label>
          <label className="text-sm font-medium">
            Phone
            <input name="phone" type="tel" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
          </label>
          <label className="text-sm font-medium">
            Email
            <input name="email" type="email" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
          </label>
          {communication.enableWhatsapp ? (
            <label className="text-sm font-medium md:col-span-2">
              WhatsApp number
              <input name="whatsappNumber" type="tel" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
            </label>
          ) : null}
          <fieldset className="md:col-span-2">
            <legend className="text-sm font-medium">New or returning client</legend>
            <RadioButtonGroup
              name="clientType"
              value="new"
              options={[
                { value: "new", label: "New" },
                { value: "returning", label: "Returning" },
              ]}
            />
          </fieldset>
          <fieldset className="md:col-span-2">
            <legend className="text-sm font-medium">Preferred contact method</legend>
            <RadioButtonGroup
              name="preferredContactMethod"
              value={communication.enableCalls ? "phone" : communication.enableEmailContact ? "email" : "whatsapp"}
              options={contactMethodOptions}
            />
          </fieldset>
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div>
            <h2 className="text-lg font-semibold">Suitability questions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Flagged answers mark the booking for review.</p>
          </div>
          {questions.map((question) => (
            <fieldset key={question.id} className="rounded-2xl bg-surface-muted p-4">
              <legend className="text-sm font-medium">{question.question}</legend>
              <RadioButtonGroup
                name={`answer:${question.id}`}
                value="no"
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
            </fieldset>
          ))}
        </div>

        <label className="block text-sm font-medium">
          Internal/request note
          <textarea name="note" rows={4} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm" />
        </label>

        <button type="submit" disabled={isPending} className="h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-fit">
          {isPending ? "Saving..." : "Save booking request"}
        </button>
      </section>

      <aside className="h-fit rounded-2xl bg-surface-muted p-5 text-sm leading-6 text-secondary-foreground lg:sticky lg:top-24">
        <p className="font-semibold text-foreground">Manual booking rules</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>At least one contact method is required.</li>
          <li>Staff can confirm the request after it is saved.</li>
          <li>Active internal services may be selected here even if hidden publicly.</li>
        </ul>
      </aside>
    </form>
  );
}