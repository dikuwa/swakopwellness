import Link from "next/link";
import { PageShell } from "@/public/components";
import { getActiveSuitabilityQuestions, getBookingRules, getBusinessSettings, getCommunicationSettings, getPublicServices } from "@/public/data";
import { submitChatBookingRequest } from "./actions";

export const dynamic = "force-dynamic";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ reference?: string; status?: string; error?: string }> }) {
  const params = await searchParams;
  const [business, communication, services, rules, questions] = await Promise.all([
    getBusinessSettings(),
    getCommunicationSettings(),
    getPublicServices(),
    getBookingRules(),
    getActiveSuitabilityQuestions(),
  ]);
  const bookableServices = services.filter((service) => service.bookingEnabled);

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
            <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Chat to book</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">Booking assistant</h1>
            <div className="mt-6 space-y-4 text-sm leading-6">
              <div className="rounded-2xl bg-surface-muted p-4 text-secondary-foreground">
                Hello. I can show approved services and collect a booking request for staff review.
              </div>
              <div className="rounded-2xl bg-surface-muted p-4 text-secondary-foreground">
                I cannot diagnose, give medical advice, promise treatment outcomes or confirm availability. Submitted times are requests until staff confirm them.
              </div>
              <div className="rounded-2xl bg-surface-muted p-4 text-secondary-foreground">
                Choose a service and complete the details. I will save the request and give you a reference only after it is stored.
              </div>
            </div>
            <Link href="/services" className="mt-6 inline-flex text-sm font-semibold text-primary underline underline-offset-4">Review services first</Link>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
            {params.reference ? (
              <div className="mb-6 rounded-2xl border border-success/30 bg-success/10 p-5" role="status">
                <p className="text-sm font-semibold text-success">Reference {params.reference}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {params.status === "requires_review" ? "Your request was saved and marked for staff review." : "Your request was saved. Staff will contact you to confirm availability."}
                </p>
              </div>
            ) : null}

            {params.error ? <p className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">{params.error}</p> : null}

            <form action={submitChatBookingRequest} className="space-y-5">
              <label className="block text-sm font-medium">
                Service
                <select name="serviceId" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                  <option value="">Choose a service</option>
                  {bookableServices.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium">Preferred date<input name="preferredDate" type="date" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
                <label className="text-sm font-medium">Preferred time<input name="preferredTime" type="time" min={rules.openingTime} max={rules.closingTime} required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
              </div>
              <label className="block text-sm font-medium">Full name<input name="fullName" required className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium">Phone<input name="phone" type="tel" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
                <label className="text-sm font-medium">Email<input name="email" type="email" className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
              </div>
              <input type="hidden" name="clientType" value="new" />
              <fieldset>
                <legend className="text-sm font-medium">Preferred contact method</legend>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {communication.enableCalls ? <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"><input name="preferredContactMethod" type="radio" value="phone" defaultChecked /> Phone</label> : null}
                  {communication.enableEmailContact ? <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"><input name="preferredContactMethod" type="radio" value="email" /> Email</label> : null}
                </div>
              </fieldset>
              <div className="space-y-3">
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
              <button type="submit" className="h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save booking request</button>
            </form>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
