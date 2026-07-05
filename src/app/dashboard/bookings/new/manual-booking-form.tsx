"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail, MessageCircle, Loader2 } from "lucide-react";
import { DatePicker, TimePicker, Select, RadioButtonGroup, Textarea, Label, Input } from "@/ui/components";
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
  const [state, formAction, isPending] = useActionState(createManualBookingAction, null);
  const router = useRouter();

  const [serviceId, setServiceId] = useState("");
  const [preferredDate, setPreferredDate] = useState<string | undefined>();
  const [preferredTime, setPreferredTime] = useState<string | undefined>();
  const [alternativeDate, setAlternativeDate] = useState<string | undefined>();
  const [alternativeTime, setAlternativeTime] = useState<string | undefined>();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [clientType, setClientType] = useState("new");
  const [preferredContactMethod, setPreferredContactMethod] = useState(communication.enableCalls ? "phone" : communication.enableEmailContact ? "email" : "whatsapp");
  const [note, setNote] = useState("");
  
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  useEffect(() => {
    if (state?.success && state.bookingId) {
      toast.success("Booking request created successfully!");
      router.push(`/dashboard/bookings/${state.bookingId}`);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

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
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}
        {state?.error && (
           <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            {state.error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Service</Label>
            <Select name="serviceId" required options={serviceOptions} placeholder="Choose a service" value={serviceId} onChange={setServiceId} />
          </div>
          <div>
            <Label>Preferred date</Label>
            <DatePicker name="preferredDate" required placeholder="Select date" minDate={new Date().toISOString().split("T")[0]} value={preferredDate} onChange={setPreferredDate} />
          </div>
          <div>
            <Label>Preferred time</Label>
            <TimePicker name="preferredTime" required placeholder="Select time" minTime={rules.openingTime} maxTime={rules.closingTime} value={preferredTime} onChange={setPreferredTime} />
          </div>
          <div>
            <Label>Alternative date</Label>
            <DatePicker name="alternativeDate" placeholder="Select date (optional)" minDate={new Date().toISOString().split("T")[0]} showClear value={alternativeDate} onChange={setAlternativeDate} />
          </div>
          <div>
            <Label>Alternative time</Label>
            <TimePicker name="alternativeTime" placeholder="Select time (optional)" minTime={rules.openingTime} maxTime={rules.closingTime} showClear value={alternativeTime} onChange={setAlternativeTime} />
          </div>
        </div>

        <div className="grid gap-4 border-t border-border pt-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Full name</Label>
            <Input name="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {communication.enableWhatsapp && (
            <div className="md:col-span-2">
              <Label>WhatsApp number</Label>
              <Input name="whatsappNumber" type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
            </div>
          )}
          <RadioButtonGroup name="clientType" label="New or returning client" value={clientType} onChange={setClientType} options={[{ value: "new", label: "New" }, { value: "returning", label: "Returning" }]} />
          <RadioButtonGroup name="preferredContactMethod" label="Preferred contact method" value={preferredContactMethod} onChange={setPreferredContactMethod} options={contactMethodOptions} />
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <div>
            <h2 className="text-lg font-semibold">Suitability questions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Flagged answers mark the booking for review.</p>
          </div>
          {questions.map((question) => (
            <fieldset key={question.id} className="rounded-2xl bg-surface-muted p-4">
              <legend className="text-sm font-medium">{question.question}</legend>
              <RadioButtonGroup name={`answer:${question.id}`} value={answers[question.id] || 'no'} onChange={(val) => handleAnswerChange(question.id, val)} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
            </fieldset>
          ))}
        </div>

        <div>
          <Label>Internal/request note</Label>
          <Textarea name="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <button type="submit" disabled={isPending} className="h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-fit flex items-center">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
