import { PageShell } from "@/public/components";
import { getActiveSuitabilityQuestions, getBookingRules, getBusinessSettings, getCommunicationSettings, getPublicServices } from "@/public/data";
import { submitBookingRequest } from "./actions";

export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ reference?: string; status?: string; error?: string }> }) {
  const params = await searchParams;
  const [business, communication, services, rules, questions] = await Promise.all([
    getBusinessSettings(),
    getCommunicationSettings(),
    getPublicServices(),
    getBookingRules(),
    getActiveSuitabilityQuestions(),
  ]);
  const bookableServices = services.filter((service) => service.bookingEnabled);
  const successStatus = params.status === "requires_review" ? "Your request was received and marked for staff review." : "Your request was received. Staff will contact you to confirm.";

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Booking request</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em]">Book an appointment</h1>
          <p className="mt-4 max-w-[65ch] text-muted-foreground">
            Submitted times are requests only. Staff will review availability and contact you before an appointment is confirmed.
          </p>
        </div>

        {params.reference ? (
          <section className="mt-8 rounded-[1.5rem] border border-success/30 bg-success/10 p-6 sm:p-8" role="status">
            <p className="text-sm font-semibold text-success">Reference {params.reference}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">{successStatus}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Keep this reference for follow-up calls or email communication.</p>
          </section>
        ) : null}

        {params.error ? (
          <section className="mt-8 rounded-[1.5rem] border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive" role="alert">
            {params.error}
          </section>
        ) : null}

        <form action={submitBookingRequest} className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <section className="space-y-6 rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold text-primary">Step 1</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Service and preferred time</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium md:col-span-2">
                Service
                <select name="serviceId" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                  <option value="">Choose a service</option>
                  {bookableServices.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">
                Preferred date
                <input name="preferredDate" type="date" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Preferred time
                <input name="preferredTime" type="time" min={rules.openingTime} max={rules.closingTime} required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Alternative date
                <input name="alternativeDate" type="date" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Alternative time
                <input name="alternativeTime" type="time" min={rules.openingTime} max={rules.closingTime} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </label>
            </div>

            <div className="border-t border-border pt-6">
              <p className="text-sm font-semibold text-primary">Step 2</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Your details</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium md:col-span-2">
                Full name
                <input name="fullName" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Phone
                <input name="phone" type="tel" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </label>
              <label className="text-sm font-medium">
                Email
                <input name="email" type="email" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              </label>
              {communication.enableWhatsapp ? (
                <label className="text-sm font-medium md:col-span-2">
                  WhatsApp number
                  <input name="whatsappNumber" type="tel" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
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

            <div className="border-t border-border pt-6">
              <p className="text-sm font-semibold text-primary">Step 3</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Suitability questions</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Flagged answers do not reject your request. They help staff review it safely.</p>
            </div>

            <div className="space-y-4">
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
              Optional note
              <textarea name="note" rows={4} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm" />
            </label>

            <button type="submit" className="h-12 w-full rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto">
              Submit request
            </button>
          </section>

          <aside className="h-fit rounded-[1.5rem] bg-surface-muted p-6 text-sm leading-6 text-secondary-foreground lg:sticky lg:top-24">
            <p className="font-semibold text-foreground">Before you submit</p>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>At least one contact method is required.</li>
              <li>Requests are reviewed before confirmation.</li>
              <li>{business.medicalDisclaimer}</li>
            </ul>
          </aside>
        </form>
      </main>
    </PageShell>
  );
}
