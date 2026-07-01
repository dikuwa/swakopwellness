"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, HeartPulse, Mail, Phone, Stethoscope } from "lucide-react";
import toast from "react-hot-toast";

type Service = {
  id: string;
  name: string;
  shortDescription: string;
  priceCents: number;
  durationMinutes: number | null;
};

type Question = {
  id: string;
  question: string;
};

type Props = {
  action: (formData: FormData) => void;
  services: Service[];
  questions: Question[];
  currencySymbol: string;
  openingTime: string;
  closingTime: string;
  timezone: string;
  enableCalls: boolean;
  enableEmailContact: boolean;
  initialServiceId?: string;
};

const steps = ["Service", "Date & Time", "Your Details", "Preferences", "Suitability", "Review"];

function formatMoney(cents: number, symbol: string) {
  return `${symbol}${(cents / 100).toLocaleString("en-NA", { maximumFractionDigits: 0 })}`;
}

export function BookingFlow({
  action,
  services,
  questions,
  currencySymbol,
  openingTime,
  closingTime,
  timezone,
  enableCalls,
  enableEmailContact,
  initialServiceId,
}: Props) {
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState(initialServiceId || services[0]?.id || "");
  const [isPending, startTransition] = useTransition();
  const currentService = useMemo(() => services.find((service) => service.id === selectedService), [selectedService, services]);
  const progress = ((step + 1) / steps.length) * 100;

  function next() {
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  function back() {
    setStep((value) => Math.max(value - 1, 0));
  }

  return (
    <form
      action={(formData) => {
        toast.loading("Sending booking request...", { id: "booking-submit" });
        startTransition(() => action(formData));
      }}
      className="mx-auto max-w-6xl"
    >
      <div className="mb-10">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6" aria-label="Booking progress">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className="group flex flex-col items-center gap-2 text-center text-xs text-muted-foreground"
              aria-current={index === step ? "step" : undefined}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                  index < step
                    ? "border-success bg-success text-primary-foreground"
                    : index === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground"
                }`}
              >
                {index < step ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className={index === step ? "font-semibold text-primary" : ""}>{label}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 h-1 rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[0_10px_40px_oklch(0.235_0.025_158_/_0.05)] sm:p-8">
        {step === 0 ? (
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-primary"><CalendarDays className="h-4 w-4" /> Book Appointment</p>
            <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">Choose your service</h1>
            <p className="mt-3 text-muted-foreground">Select the service you would like to request.</p>
            <div className="mt-8 space-y-4">
              {services.map((service) => (
                <label
                  key={service.id}
                  className={`grid cursor-pointer gap-4 rounded-2xl border p-5 transition-colors md:grid-cols-[auto_1fr_auto_auto] md:items-center ${
                    selectedService === service.id ? "border-primary bg-primary/5" : "border-border hover:bg-surface-muted/60"
                  }`}
                >
                  <input name="serviceId" type="radio" value={service.id} checked={selectedService === service.id} onChange={() => setSelectedService(service.id)} className="h-5 w-5 accent-[oklch(0.355_0.074_159)]" />
                  <div className="flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary"><HeartPulse className="h-7 w-7" /></span>
                    <span>
                      <span className="block text-lg font-semibold text-foreground">{service.name}</span>
                      <span className="mt-1 block max-w-xl text-sm leading-6 text-muted-foreground">{service.shortDescription}</span>
                    </span>
                  </div>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{service.durationMinutes ?? 30} minutes</span>
                  <span className="text-lg font-semibold text-primary">{formatMoney(service.priceCents, currencySymbol)}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-6">
            <h1 className="text-4xl font-semibold sm:text-5xl">Select date &amp; time</h1>
            <label className="text-sm font-medium">
              Preferred date
              <input name="preferredDate" type="date" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
            <label className="text-sm font-medium">
              Preferred time
              <input name="preferredTime" type="time" min={openingTime} max={closingTime} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">
                Alternative date <span className="text-muted-foreground">(optional)</span>
                <input name="alternativeDate" type="date" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Alternative time <span className="text-muted-foreground">(optional)</span>
                <input name="alternativeTime" type="time" min={openingTime} max={closingTime} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </label>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />All times are local time ({timezone}).</p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <h1 className="text-4xl font-semibold md:col-span-2 sm:text-5xl">Your details</h1>
            <label className="text-sm font-medium md:col-span-2">
              Full name
              <input name="fullName" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
            <label className="text-sm font-medium">
              Phone
              <input name="phone" type="tel" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
            <label className="text-sm font-medium">
              Email
              <input name="email" type="email" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm" />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h1 className="text-4xl font-semibold sm:text-5xl">Preferences</h1>
            <div className="mt-8 grid gap-6">
              <fieldset>
                <legend className="text-sm font-medium">New or returning client</legend>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-4"><input name="clientType" type="radio" value="new" defaultChecked /> New</label>
                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-4"><input name="clientType" type="radio" value="returning" /> Returning</label>
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium">Preferred contact method</legend>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {enableCalls ? <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-4"><input name="preferredContactMethod" type="radio" value="phone" defaultChecked /> <Phone className="h-4 w-4" /> Phone call</label> : null}
                  {enableEmailContact ? <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-4"><input name="preferredContactMethod" type="radio" value="email" defaultChecked={!enableCalls} /> <Mail className="h-4 w-4" /> Email</label> : null}
                </div>
              </fieldset>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <h1 className="text-4xl font-semibold sm:text-5xl">Suitability</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Please answer honestly. Flagged answers do not reject your request automatically; they help staff review whether a service should be modified or discussed first.</p>
            <div className="mt-6 space-y-4">
              {questions.map((question) => (
                <fieldset key={question.id} className="rounded-2xl bg-surface-muted p-4">
                  <legend className="text-sm font-medium">{question.question}</legend>
                  <div className="mt-3 flex gap-4 text-sm">
                    <label className="flex items-center gap-2"><input name={`answer:${question.id}`} type="radio" value="yes" /> Yes</label>
                    <label className="flex items-center gap-2"><input name={`answer:${question.id}`} type="radio" value="no" defaultChecked /> No</label>
                  </div>
                </fieldset>
              ))}
            </div>
            <label className="mt-5 block text-sm font-medium">
              Optional note
              <textarea name="note" rows={4} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm" />
            </label>
          </div>
        ) : null}

        {step === 5 ? (
          <div>
            <h1 className="text-4xl font-semibold sm:text-5xl">Review request</h1>
            <div className="mt-8 rounded-2xl bg-surface-muted p-5">
              <p className="text-sm font-semibold text-primary">Selected service</p>
              <p className="mt-2 text-lg font-semibold">{currentService?.name ?? "Choose a service"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{currentService ? `${formatMoney(currentService.priceCents, currencySymbol)} · ${currentService.durationMinutes ?? 30} minutes` : ""}</p>
            </div>
            <p className="mt-5 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-foreground">
              By submitting, you acknowledge these are complementary wellness services and that your appointment is a request until staff confirm it.
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
          <button type="button" onClick={back} disabled={step === 0} className="inline-flex h-12 items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold disabled:opacity-40">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button type="button" onClick={next} className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" disabled={isPending} className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {isPending ? "Sending..." : "Confirm request"} <Stethoscope className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>
    </form>
  );
}
