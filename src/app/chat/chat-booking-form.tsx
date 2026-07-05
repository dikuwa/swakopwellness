"use client";

import { useState } from "react";
import { Phone, Mail } from "lucide-react";
import { DatePicker, TimePicker, Select, RadioButtonGroup } from "@/ui/components";
import { useActionState } from "react";
import toast from "react-hot-toast";
import { submitChatBookingRequest } from "./actions";

interface ChatBookingFormProps {
  bookableServices: Array<{ id: string; name: string }>;
  questions: Array<{ id: string; question: string }>;
  communication: {
    enableCalls: boolean;
    enableEmailContact: boolean;
  };
  rules: {
    openingTime: string;
    closingTime: string;
  };
  initialServiceId?: string;
}

export function ChatBookingForm({
  bookableServices,
  questions,
  communication,
  rules,
  initialServiceId,
}: ChatBookingFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => submitChatBookingRequest(formData),
    null
  );

  const serviceOptions = bookableServices.map((service) => ({
    value: service.id,
    label: service.name,
  }));

  return (
    <form action={formAction} className="space-y-5">
      <label className="block text-sm font-medium">
        Service
        <Select
          name="serviceId"
          required
          options={serviceOptions}
          placeholder="Choose a service"
          defaultValue={initialServiceId || ""}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
      <label className="block text-sm font-medium">
        Full name
        <input name="fullName" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Phone
          <input name="phone" type="tel" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
        </label>
        <label className="text-sm font-medium">
          Email
          <input name="email" type="email" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
        </label>
      </div>
      <input type="hidden" name="clientType" value="new" />
      <fieldset>
        <legend className="text-sm font-medium">Preferred contact method</legend>
        <RadioButtonGroup
          name="preferredContactMethod"
          value={communication.enableCalls ? "phone" : "email"}
          onChange={() => {}}
          options={[
            ...(communication.enableCalls ? [{ value: "phone", label: "Phone", icon: <Phone className="h-4 w-4" /> }] : []),
            ...(communication.enableEmailContact ? [{ value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> }] : []),
          ]}
        />
      </fieldset>
      <div className="space-y-3">
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
      <button type="submit" disabled={isPending} className="h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
        {isPending ? "Saving..." : "Save booking request"}
      </button>
    </form>
  );
}