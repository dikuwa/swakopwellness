import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { PageShell } from "@/public/components";
import { formatMoney, getBusinessSettings, getCommunicationSettings, getPublicServices } from "@/public/data";
import { formatServiceTitle } from "@/public/service-title";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services",
  description: "Explore our wellness services, prices and descriptions. Book an appointment online.",
};

export default async function ServicesPage() {
  const [business, communication, services] = await Promise.all([getBusinessSettings(), getCommunicationSettings(), getPublicServices()]);

  return (
    <PageShell business={business} communication={communication}>
      <main>
        <section className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8">
          <p className="inline-flex rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-primary">Services</p>
          <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-semibold sm:text-6xl">Complementary wellness services by appointment</h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">Choose from non-invasive assessments and frequency-based support. Prices, durations and service details are loaded from editable service records.</p>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="grid items-stretch gap-6 md:grid-cols-2">
            {services.map((service) => (
              <article key={service.id} className="group relative flex h-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_oklch(0.235_0.025_158_/_0.04)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_45px_oklch(0.235_0.025_158_/_0.12)]">
                <Link
                  href={`/services/${service.slug}`}
                  className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={`View ${formatServiceTitle(service.name, service.slug)}`}
                />
                <div className="relative z-10 flex min-h-full w-full flex-col pointer-events-none">
                  {service.featuredImage ? (
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#f7f1e8]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- media URLs are administrator-managed public URLs. */}
                      <img
                        src={service.featuredImage.publicUrl}
                        alt={service.featuredImage.altText ?? formatServiceTitle(service.name, service.slug)}
                        className="h-full w-full object-cover object-center saturate-[0.92] contrast-[0.96] brightness-[0.98] transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10 mix-blend-multiply" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fbf7ef]/88 via-[#fbf7ef]/35 to-transparent" />
                      <div className="pointer-events-none absolute inset-0 bg-[#f8f2e8]/10" />
                      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/10" />
                    </div>
                  ) : (
                    <div className="relative aspect-[16/9] overflow-hidden bg-[linear-gradient(135deg,oklch(0.924_0.025_116),oklch(0.988_0.009_85))]">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/20 to-accent/15" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fbf7ef]/88 via-[#fbf7ef]/35 to-transparent" />
                    </div>
                  )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h2 className="text-2xl font-semibold">{formatServiceTitle(service.name, service.slug)}</h2>
                    <span className="w-fit rounded-full bg-surface-muted px-3 py-1 text-sm font-semibold text-primary ring-1 ring-primary/10">{formatMoney(service.priceCents, business.currencySymbol)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.shortDescription}</p>
                  <div className="mt-auto pt-5">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{service.durationMinutes ?? 30} minutes</p>
                  </div>
                  <div className="pointer-events-auto relative z-20 mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link href={`/services/${service.slug}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold transition-colors hover:bg-surface-muted">View details</Link>
                    {service.bookingEnabled ? <Link href={`/book?service=${service.slug}`} className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Book this service</Link> : null}
                  </div>
                </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="rounded-2xl border border-warning/25 bg-warning/10 p-6">
            <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5 text-warning" /> Complementary wellness notice</p>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">{business.medicalDisclaimer}</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-10">
            <h2 className="text-3xl font-semibold">Ready to request an appointment?</h2>
            <p className="mt-3 text-primary-foreground/75">Our team will review availability and confirm your request.</p>
            <Link href="/book" className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-primary-foreground px-6 text-sm font-semibold text-primary">Book appointment</Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
