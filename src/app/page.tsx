import Link from "next/link";
import { PageShell } from "@/public/components";
import { formatMoney, getBusinessSettings, getCommunicationSettings, getFeaturedServices, getPublicFaqs } from "@/public/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [business, communication, services, faqs] = await Promise.all([
    getBusinessSettings(),
    getCommunicationSettings(),
    getFeaturedServices(),
    getPublicFaqs(),
  ]);

  return (
    <PageShell business={business} communication={communication}>
      <main className="bg-background text-foreground">
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">{business.appointmentModel}</p>
            <h1 className="mt-4 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-[-0.05em] text-balance sm:text-7xl">
              Clear wellness support, guided by careful assessment.
            </h1>
            <p className="mt-6 max-w-[65ch] text-lg leading-8 text-muted-foreground">
              Explore services, review pricing and request an appointment with {business.businessName}. All bookings are requests until confirmed by staff.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Book an appointment
              </Link>
              <Link href="/chat" className="flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-surface-muted">
                Chat to book
              </Link>
              {communication.enableCalls ? (
                <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-surface-muted">
                  Call now
                </a>
              ) : null}
            </div>
          </div>
          <aside className="rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)]">
            <p className="text-sm font-semibold text-foreground">Safety note</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{business.medicalDisclaimer}</p>
            <div className="mt-6 rounded-2xl bg-surface-muted p-4 text-sm leading-6 text-secondary-foreground">
              {business.operatingHours}, {business.address}
            </div>
          </aside>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.035em]">Services and prices</h2>
              <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">Editable service records power the website, booking flow and future chatbot knowledge.</p>
            </div>
            <Link href="/services" className="text-sm font-semibold text-primary underline underline-offset-4">View all services</Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <Link key={service.id} href={`/services/${service.slug}`} className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:bg-surface-muted">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">{service.name}</h3>
                  <p className="shrink-0 text-sm font-semibold text-primary">{formatMoney(service.priceCents, business.currencySymbol)}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.shortDescription}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="rounded-[1.5rem] bg-surface-muted p-6 sm:p-8">
            <h2 className="text-3xl font-semibold tracking-[-0.035em]">How requests work</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                "Choose a service and preferred time.",
                "Staff review suitability notes and availability.",
                "Your appointment is confirmed manually.",
              ].map((step, index) => (
                <div key={step} className="rounded-2xl bg-surface p-5 text-sm leading-6">
                  <span className="text-sm font-semibold text-primary">0{index + 1}</span>
                  <p className="mt-3 text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <h2 className="text-3xl font-semibold tracking-[-0.035em]">Common questions</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.slice(0, 2).map((faq) => (
              <article key={faq.id} className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
