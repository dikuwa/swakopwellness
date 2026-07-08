import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Phone } from "lucide-react";
import { PageShell } from "@/public/components";
import { formatMoney, getBusinessSettings, getCommunicationSettings, getPublicServices, getServiceBySlug } from "@/public/data";
import { getMediaUrl } from "@/lib/media-url";
import { formatServiceTitle } from "@/public/service-title";

export const dynamic = "force-dynamic";

type GalleryImage = { id: string; publicUrl: string | null; altText: string | null; width: number | null; height: number | null };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  const title = formatServiceTitle(service.name, service.slug);
  return {
    title,
    description: service.shortDescription || `${title} - View service details and pricing.`,
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [business, communication, service, services] = await Promise.all([
    getBusinessSettings(),
    getCommunicationSettings(),
    getServiceBySlug(slug),
    getPublicServices(),
  ]);
  const gallery = "gallery" in service ? (service as { gallery: GalleryImage[] }).gallery : [];
  const related = services.filter((item) => item.slug !== service.slug).slice(0, 3);
  const title = formatServiceTitle(service.name, service.slug);

  return (
    <PageShell business={business} communication={communication}>
      <main>
        <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" />All services</Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-primary">{formatMoney(service.priceCents, business.currencySymbol)}{service.durationMinutes ? ` · about ${service.durationMinutes} minutes` : ""}</p>
              <h1 className="mt-4 text-5xl font-semibold sm:text-6xl">{title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{service.shortDescription}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {service.bookingEnabled ? <Link href={`/book?service=${service.slug}`} className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Book this service</Link> : null}
                {communication.enableCalls ? <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold"><Phone className="h-4 w-4" />Call now</a> : null}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              {service.featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- media URLs are administrator-managed public URLs.
                <img src={service.featuredImage.publicUrl} alt={service.featuredImage.altText ?? title} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              ) : (
                <div className="aspect-[4/3] bg-[linear-gradient(135deg,oklch(0.924_0.025_116),oklch(0.988_0.009_85))]" />
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-16 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-3xl font-semibold">What it is</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{service.fullDescription}</p>
          </article>
          <aside className="rounded-2xl bg-surface-muted p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">At a glance</h2>
            <div className="mt-5 space-y-4 text-sm">
              <p className="flex items-center justify-between gap-4 border-b border-border pb-3"><span>Price</span><strong>{formatMoney(service.priceCents, business.currencySymbol)}</strong></p>
              <p className="flex items-center justify-between gap-4 border-b border-border pb-3"><span>Duration</span><strong>{service.durationMinutes ?? 30} minutes</strong></p>
              <p className="flex items-center justify-between gap-4"><span>Appointment</span><strong>Request required</strong></p>
            </div>
          </aside>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-16 sm:px-8 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-2xl font-semibold">How it works</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.whatToExpect ?? "A gentle, appointment-based session where your practitioner explains the process and guides you through the service."}</p>
          </article>
          <article className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-2xl font-semibold">What to expect</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.preparation ?? "Please arrive a few minutes early and share any relevant suitability information with the team."}</p>
          </article>
          <article className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-2xl font-semibold">May support</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              {service.benefits.length > 0 ? service.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{benefit}</li>
              )) : <li>Personalised wellness understanding and support.</li>}
            </ul>
          </article>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="rounded-2xl border border-warning/25 bg-warning/10 p-6">
            <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5 text-warning" /> Suitability and safety</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.safetyInformation || business.medicalDisclaimer}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{business.medicalDisclaimer}</p>
          </div>
        </section>

        {gallery.length > 0 ? (
          <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
            <h2 className="text-3xl font-semibold">Gallery</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {gallery.map((img) => (
                <div key={img.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                 {/* eslint-disable-next-line @next/next/no-img-element -- media URLs are administrator-managed public URLs. */}
                  <img src={getMediaUrl(img)} alt={img.altText ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {service.faqs.length > 0 ? (
          <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
            <h2 className="text-3xl font-semibold">Service FAQs</h2>
            <div className="mt-5 space-y-4">
              {service.faqs.map((faq) => (
                <article key={faq.id} className="rounded-2xl border border-border bg-surface p-5">
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="rounded-2xl bg-surface-muted p-6 sm:p-8">
            <h2 className="text-3xl font-semibold">Related services</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link key={item.slug} href={`/services/${item.slug}`} className="rounded-xl border border-border bg-surface p-5 hover:bg-background">
                  <h3 className="font-semibold">{formatServiceTitle(item.name, item.slug)}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{item.durationMinutes ?? 30} minutes</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
