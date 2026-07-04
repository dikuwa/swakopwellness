import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getActiveSuitabilityQuestionsForDashboard, getBookableServicesForManualUse } from "@/dashboard/data";
import { getBookingRules, getCommunicationSettings } from "@/public/data";
import { createManualBookingAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Booking — Dashboard",
};

export default async function NewManualBookingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requirePermission("bookings:create");
  const params = await searchParams;
  const [services, questions, rules, communication] = await Promise.all([
    getBookableServicesForManualUse(),
    getActiveSuitabilityQuestionsForDashboard(),
    getBookingRules(),
    getCommunicationSettings(),
  ]);

  return (
    <DashboardShell>
      <Link href="/dashboard/bookings" className="text-sm text-muted-foreground hover:text-foreground">&larr; Bookings</Link>
        <div className="mt-3 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Add Manual Booking</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use this for phone or in-person requests. The booking is still saved as a request unless staff confirms it afterwards.
          </p>
        </div>

        {params.error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            {params.error}
          </div>
        ) : null}

        <form action={createManualBookingAction} className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <section className="space-y-6 rounded-2xl border border-border bg-background p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium md:col-span-2">
                Service
                <select name="serviceId" required className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm">
                  <option value="">Choose a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.name} - N${(service.priceCents / 100).toFixed(2)}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Preferred date
                <input name="preferredDate" type="date" required className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Preferred time
                <input name="preferredTime" type="time" min={rules.openingTime} max={rules.closingTime} required className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Alternative date
                <input name="alternativeDate" type="date" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Alternative time
                <input name="alternativeTime" type="time" min={rules.openingTime} max={rules.closingTime} className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
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
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"><input name="clientType" type="radio" value="new" defaultChecked /> New</label>
                  <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"><input name="clientType" type="radio" value="returning" /> Returning</label>
                </div>
              </fieldset>
              <fieldset className="md:col-span-2">
                <legend className="text-sm font-medium">Preferred contact method</legend>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {communication.enableCalls ? <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"><input name="preferredContactMethod" type="radio" value="phone" defaultChecked /> Phone</label> : null}
                  {communication.enableEmailContact ? <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"><input name="preferredContactMethod" type="radio" value="email" /> Email</label> : null}
                  {communication.enableWhatsapp ? <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"><input name="preferredContactMethod" type="radio" value="whatsapp" /> WhatsApp</label> : null}
                </div>
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
                  <div className="mt-3 flex gap-3 text-sm">
                    <label className="flex items-center gap-2"><input name={`answer:${question.id}`} type="radio" value="yes" /> Yes</label>
                    <label className="flex items-center gap-2"><input name={`answer:${question.id}`} type="radio" value="no" defaultChecked /> No</label>
                  </div>
                </fieldset>
              ))}
            </div>

            <label className="block text-sm font-medium">
              Internal/request note
              <textarea name="note" rows={4} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm" />
            </label>

            <button type="submit" className="h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:w-fit">
              Save booking request
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
    </DashboardShell>
  );
}
