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

type BookingDraft = {
  serviceId: string;
  preferredDate: string;
  preferredTime: string;
  alternativeDate: string;
  alternativeTime: string;
  fullName: string;
  phone: string;
  email: string;
  clientType: "new" | "returning";
  preferredContactMethod: "phone" | "email";
  note: string;
  answers: Record<string, "yes" | "no">;
};

const steps = ["Service", "Date & Time", "Your Details", "Preferences", "Suitability", "Review"];

function formatMoney(cents: number, symbol: string) {
  return `${symbol}${(cents / 100).toLocaleString("en-NA", { maximumFractionDigits: 0 })}`;
}

function toDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatLongDate(value: string) {
  if (!value) return "Not selected";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-NA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function buildDateOptions(days = 14) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      value: toDateValue(date),
      day: date.toLocaleDateString("en-NA", { weekday: "short" }),
      date: date.toLocaleDateString("en-NA", { day: "numeric", month: "short" }),
    };
  });
}

function buildTimeOptions(openingTime: string, closingTime: string) {
  const [openHour = 8, openMinute = 0] = openingTime.split(":").map(Number);
  const [closeHour = 17, closeMinute = 0] = closingTime.split(":").map(Number);
  const start = openHour * 60 + openMinute;
  const end = closeHour * 60 + closeMinute;
  const slots: string[] = [];

  for (let minute = start; minute < end; minute += 30) {
    if (minute >= 12 * 60 && minute < 13 * 60) continue;
    const hour = Math.floor(minute / 60);
    const mins = minute % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
  }

  return slots;
}

function OptionButton({
  selected,
  children,
  onClick,
  compact = false,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border text-left text-sm font-semibold transition-colors ${
        compact ? "min-h-11 px-4 py-2" : "min-h-16 px-4 py-3"
      } ${selected ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_20px_oklch(0.355_0.074_159_/_0.16)]" : "border-border bg-background text-foreground hover:bg-surface-muted"}`}
      aria-pressed={selected}
    >
      {children}
    </button>
  );
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
  const initialAnswers = useMemo(
    () => Object.fromEntries(questions.map((question) => [question.id, "no" as const])),
    [questions],
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<BookingDraft>({
    serviceId: initialServiceId || services[0]?.id || "",
    preferredDate: "",
    preferredTime: "",
    alternativeDate: "",
    alternativeTime: "",
    fullName: "",
    phone: "",
    email: "",
    clientType: "new",
    preferredContactMethod: enableCalls ? "phone" : "email",
    note: "",
    answers: initialAnswers,
  });

  const currentService = useMemo(() => services.find((service) => service.id === draft.serviceId), [draft.serviceId, services]);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const timeOptions = useMemo(() => buildTimeOptions(openingTime, closingTime), [openingTime, closingTime]);
  const progress = ((step + 1) / steps.length) * 100;

  function updateDraft(patch: Partial<BookingDraft>) {
    setDraft((value) => ({ ...value, ...patch }));
    setError("");
  }

  function validateStep(targetStep = step) {
    if (targetStep === 0 && !draft.serviceId) return "Please choose a service.";
    if (targetStep === 1 && (!draft.preferredDate || !draft.preferredTime)) return "Please choose a preferred date and time.";
    if (targetStep === 2 && !draft.fullName.trim()) return "Please enter your full name.";
    if (targetStep === 2 && !draft.phone.trim() && !draft.email.trim()) return "Please provide at least one contact method.";
    if (targetStep === 3 && draft.preferredContactMethod === "phone" && !draft.phone.trim()) return "Please add a phone number or choose email as your contact method.";
    if (targetStep === 3 && draft.preferredContactMethod === "email" && !draft.email.trim()) return "Please add an email address or choose phone as your contact method.";
    return "";
  }

  function next() {
    const message = validateStep();
    if (message) {
      setError(message);
      toast.error(message);
      return;
    }
    setStep((value) => Math.min(value + 1, steps.length - 1));
    setError("");
  }

  function back() {
    setStep((value) => Math.max(value - 1, 0));
    setError("");
  }

  function submit(formData: FormData) {
    for (let index = 0; index < steps.length - 1; index += 1) {
      const message = validateStep(index);
      if (message) {
        setStep(index);
        setError(message);
        toast.error(message);
        return;
      }
    }

    toast.loading("Sending booking request...", { id: "booking-submit" });
    startTransition(() => action(formData));
  }

  return (
    <form action={submit} className="mx-auto max-w-6xl">
      <input type="hidden" name="serviceId" value={draft.serviceId} />
      <input type="hidden" name="preferredDate" value={draft.preferredDate} />
      <input type="hidden" name="preferredTime" value={draft.preferredTime} />
      <input type="hidden" name="alternativeDate" value={draft.alternativeDate} />
      <input type="hidden" name="alternativeTime" value={draft.alternativeTime} />
      <input type="hidden" name="fullName" value={draft.fullName} />
      <input type="hidden" name="phone" value={draft.phone} />
      <input type="hidden" name="email" value={draft.email} />
      <input type="hidden" name="clientType" value={draft.clientType} />
      <input type="hidden" name="preferredContactMethod" value={draft.preferredContactMethod} />
      <input type="hidden" name="note" value={draft.note} />
      {questions.map((question) => (
        <input key={question.id} type="hidden" name={`answer:${question.id}`} value={draft.answers[question.id] ?? "no"} />
      ))}

      {error ? (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive" role="alert">
          {error}
        </div>
      ) : null}

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
            <h1 className="display-tight mt-6 text-4xl font-semibold sm:text-5xl">Choose your service</h1>
            <p className="mt-3 text-muted-foreground">Select the service you would like to request.</p>
            <div className="mt-8 space-y-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => updateDraft({ serviceId: service.id })}
                  className={`grid w-full cursor-pointer gap-4 rounded-2xl border p-5 text-left transition-colors md:grid-cols-[auto_1fr_auto_auto] md:items-center ${
                    draft.serviceId === service.id ? "border-primary bg-primary/5" : "border-border hover:bg-surface-muted/60"
                  }`}
                  aria-pressed={draft.serviceId === service.id}
                >
                  <span className={`flex h-5 w-5 rounded-full border ${draft.serviceId === service.id ? "border-primary bg-primary shadow-[inset_0_0_0_4px_var(--surface)]" : "border-muted-foreground/60"}`} />
                  <span className="flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary"><HeartPulse className="h-7 w-7" /></span>
                    <span>
                      <span className="block text-lg font-semibold text-foreground">{service.name}</span>
                      <span className="mt-1 block max-w-xl text-sm leading-6 text-muted-foreground">{service.shortDescription}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{service.durationMinutes ?? 30} minutes</span>
                  <span className="text-lg font-semibold text-primary">{formatMoney(service.priceCents, currencySymbol)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-7">
            <h1 className="display-tight text-4xl font-semibold sm:text-5xl">Select date &amp; time</h1>
            <fieldset>
              <legend className="text-sm font-semibold">Preferred date</legend>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {dateOptions.map((option) => (
                  <OptionButton key={option.value} selected={draft.preferredDate === option.value} onClick={() => updateDraft({ preferredDate: option.value })}>
                    <span className="block text-xs opacity-75">{option.day}</span>
                    <span className="mt-1 block text-base">{option.date}</span>
                  </OptionButton>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold">Preferred time</legend>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {timeOptions.map((time) => (
                  <OptionButton key={time} selected={draft.preferredTime === time} onClick={() => updateDraft({ preferredTime: time })} compact>
                    {time}
                  </OptionButton>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-5 md:grid-cols-2">
              <fieldset>
                <legend className="text-sm font-semibold">Alternative date <span className="font-normal text-muted-foreground">(optional)</span></legend>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <OptionButton selected={!draft.alternativeDate} onClick={() => updateDraft({ alternativeDate: "", alternativeTime: "" })} compact>None</OptionButton>
                  {dateOptions.slice(1, 5).map((option) => (
                    <OptionButton key={option.value} selected={draft.alternativeDate === option.value} onClick={() => updateDraft({ alternativeDate: option.value })} compact>
                      {option.date}
                    </OptionButton>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-semibold">Alternative time <span className="font-normal text-muted-foreground">(optional)</span></legend>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <OptionButton selected={!draft.alternativeTime} onClick={() => updateDraft({ alternativeTime: "" })} compact>Any time</OptionButton>
                  {timeOptions.slice(0, 7).map((time) => (
                    <OptionButton key={time} selected={draft.alternativeTime === time} onClick={() => updateDraft({ alternativeTime: time })} compact>
                      {time}
                    </OptionButton>
                  ))}
                </div>
              </fieldset>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />All times are local time ({timezone}).</p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-5 md:grid-cols-2">
            <h1 className="display-tight text-4xl font-semibold md:col-span-2 sm:text-5xl">Your details</h1>
            <label className="text-sm font-semibold md:col-span-2">
              Full name
              <input value={draft.fullName} onChange={(event) => updateDraft({ fullName: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-primary" />
            </label>
            <label className="text-sm font-semibold">
              Phone
              <input value={draft.phone} onChange={(event) => updateDraft({ phone: event.target.value })} type="tel" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-primary" />
            </label>
            <label className="text-sm font-semibold">
              Email
              <input value={draft.email} onChange={(event) => updateDraft({ email: event.target.value })} type="email" className="mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-primary" />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h1 className="display-tight text-4xl font-semibold sm:text-5xl">Preferences</h1>
            <div className="mt-8 grid gap-6">
              <fieldset>
                <legend className="text-sm font-semibold">New or returning client</legend>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <OptionButton compact selected={draft.clientType === "new"} onClick={() => updateDraft({ clientType: "new" })}>New client</OptionButton>
                  <OptionButton compact selected={draft.clientType === "returning"} onClick={() => updateDraft({ clientType: "returning" })}>Returning client</OptionButton>
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-semibold">Preferred contact method</legend>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {enableCalls ? <OptionButton compact selected={draft.preferredContactMethod === "phone"} onClick={() => updateDraft({ preferredContactMethod: "phone" })}><span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />Phone call</span></OptionButton> : null}
                  {enableEmailContact ? <OptionButton compact selected={draft.preferredContactMethod === "email"} onClick={() => updateDraft({ preferredContactMethod: "email" })}><span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />Email</span></OptionButton> : null}
                </div>
              </fieldset>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <h1 className="display-tight text-4xl font-semibold sm:text-5xl">Suitability</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Please answer honestly. Flagged answers do not reject your request automatically; they help staff review whether a service should be modified or discussed first.</p>
            <div className="mt-6 space-y-4">
              {questions.map((question) => (
                <fieldset key={question.id} className="rounded-2xl border border-border bg-surface-muted p-4">
                  <legend className="px-1 text-sm font-semibold">{question.question}</legend>
                  <div className="mt-3 flex gap-3 text-sm">
                    <OptionButton compact selected={draft.answers[question.id] === "yes"} onClick={() => updateDraft({ answers: { ...draft.answers, [question.id]: "yes" } })}>Yes</OptionButton>
                    <OptionButton compact selected={(draft.answers[question.id] ?? "no") === "no"} onClick={() => updateDraft({ answers: { ...draft.answers, [question.id]: "no" } })}>No</OptionButton>
                  </div>
                </fieldset>
              ))}
            </div>
            <label className="mt-5 block text-sm font-semibold">
              Optional note
              <textarea value={draft.note} onChange={(event) => updateDraft({ note: event.target.value })} rows={4} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary" />
            </label>
          </div>
        ) : null}

        {step === 5 ? (
          <div>
            <h1 className="display-tight text-4xl font-semibold sm:text-5xl">Review request</h1>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <ReviewItem label="Service" value={currentService?.name ?? "Choose a service"} helper={currentService ? `${formatMoney(currentService.priceCents, currencySymbol)} · ${currentService.durationMinutes ?? 30} minutes` : ""} />
              <ReviewItem label="Preferred date & time" value={`${formatLongDate(draft.preferredDate)} at ${draft.preferredTime || "not selected"}`} />
              <ReviewItem label="Alternative" value={draft.alternativeDate ? `${formatLongDate(draft.alternativeDate)}${draft.alternativeTime ? ` at ${draft.alternativeTime}` : " · any time"}` : "None"} />
              <ReviewItem label="Client" value={draft.fullName || "Not entered"} helper={[draft.phone, draft.email].filter(Boolean).join(" · ")} />
              <ReviewItem label="Contact preference" value={draft.preferredContactMethod === "phone" ? "Phone call" : "Email"} />
              <ReviewItem label="Client type" value={draft.clientType === "new" ? "New client" : "Returning client"} />
            </div>
            <div className="mt-4 rounded-2xl bg-surface-muted p-5">
              <p className="text-sm font-semibold text-primary">Suitability answers</p>
              <dl className="mt-3 grid gap-3 text-sm">
                {questions.map((question) => (
                  <div key={question.id} className="grid gap-1 sm:grid-cols-[1fr_auto]">
                    <dt className="text-muted-foreground">{question.question}</dt>
                    <dd className="font-semibold text-foreground">{draft.answers[question.id] ?? "no"}</dd>
                  </div>
                ))}
              </dl>
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

function ReviewItem({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-2xl bg-surface-muted p-5">
      <p className="text-sm font-semibold text-primary">{label}</p>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
