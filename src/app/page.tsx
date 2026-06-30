import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/public/components";
import { formatMoney, getBusinessSettings, getCommunicationSettings, getFeaturedServices, getPublicFaqs } from "@/public/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Swakop Wellness Centre",
  description: "Complementary wellness services, health assessments and frequency-based wellness support in Swakopmund, Namibia. Book an appointment online.",
};

export default async function Home() {
  const [business, communication, services, faqs] = await Promise.all([
    getBusinessSettings(),
    getCommunicationSettings(),
    getFeaturedServices(),
    getPublicFaqs(),
  ]);

  return (
    <PageShell business={business} communication={communication}>
      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">{business.appointmentModel}</p>
            <h1 className="mt-4 max-w-3xl text-5xl leading-[1.08] tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
              Wellness support, guided by careful assessment.
            </h1>
            <p className="mt-6 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Explore non-invasive wellness services and request an appointment with {business.businessName}. All bookings are requests until confirmed by staff.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_16px_oklch(0.355_0.074_159_/_0.35)]">
                Book an appointment
              </Link>
              <Link href="/chat" className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold transition-colors hover:bg-surface-muted">
                Chat to book
              </Link>
              {communication.enableCalls ? (
                <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold transition-colors hover:bg-surface-muted">
                  Call now
                </a>
              ) : null}
            </div>
          </div>
          <aside className="rounded-2xl border border-border bg-surface p-6 shadow-[0_4px_24px_oklch(0.235_0.025_158_/_0.04)] sm:p-8">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 9v4M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              Safety note
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{business.medicalDisclaimer}</p>
            <div className="mt-6 rounded-xl bg-surface-muted p-4 text-sm leading-6 text-secondary-foreground">
              <p className="font-medium">{business.operatingHours}</p>
              <p className="mt-1">{business.address}</p>
            </div>
          </aside>
        </section>

        {/* Services */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl tracking-[-0.03em] sm:text-4xl">Services and prices</h2>
              <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">Non-invasive wellness assessments and frequency-based support. Every service is fully editable from the dashboard.</p>
            </div>
            <Link href="/services" className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted">
              View all services
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {services.map((service) => (
              <Link key={service.id} href={`/services/${service.slug}`} className="group rounded-2xl border border-border bg-surface shadow-[0_2px_12px_oklch(0.235_0.025_158_/_0.03)] transition-all duration-200 hover:shadow-[0_4px_24px_oklch(0.235_0.025_158_/_0.06)] hover:-translate-y-0.5">
                {service.featuredImage?.publicUrl ? (
                  <div className="aspect-[16/9] overflow-hidden rounded-t-2xl bg-surface">
                    <img src={service.featuredImage.publicUrl} alt={service.featuredImage.altText ?? service.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                ) : null}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl tracking-[-0.02em]">{service.name}</h3>
                    <p className="shrink-0 text-sm font-semibold text-primary">{formatMoney(service.priceCents, business.currencySymbol)}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.shortDescription}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="rounded-2xl bg-surface-muted p-6 sm:p-10">
            <h2 className="text-3xl tracking-[-0.03em] sm:text-4xl">How appointments work</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                { step: "01", title: "Choose a service", desc: "Browse services and pricing, then pick what suits your needs." },
                { step: "02", title: "Request a time", desc: "Staff review suitability and availability before confirming." },
                { step: "03", title: "Visit the centre", desc: "Receive your wellness session at our Swakopmund location." },
              ].map((item) => (
                <div key={item.step} className="rounded-xl bg-surface p-5 transition-all duration-200 hover:shadow-[0_2px_12px_oklch(0.235_0.025_158_/_0.04)]">
                  <span className="text-sm font-semibold tracking-wider text-primary">{item.step}</span>
                  <h3 className="mt-2 text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ preview */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl tracking-[-0.03em] sm:text-4xl">Common questions</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Quick answers to the most common questions about our services.</p>
            </div>
            <Link href="/faqs" className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted">
              View all FAQs
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.slice(0, 2).map((faq) => (
              <article key={faq.id} className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-[0_4px_24px_oklch(0.235_0.025_158_/_0.04)] sm:p-12">
            <h2 className="text-3xl tracking-[-0.03em] sm:text-4xl">Ready to get started?</h2>
            <p className="mx-auto mt-4 max-w-[50ch] text-sm leading-6 text-muted-foreground">
              Request an appointment online or chat with our booking assistant. Our team will follow up to confirm your session.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/book" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_16px_oklch(0.355_0.074_159_/_0.35)]">
                Book an appointment
              </Link>
              <Link href="/chat" className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold transition-colors hover:bg-surface-muted">
                Chat to book
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
