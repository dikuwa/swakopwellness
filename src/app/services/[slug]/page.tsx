import Link from "next/link";
import { PageShell } from "@/public/components";
import { formatMoney, getBusinessSettings, getCommunicationSettings, getServiceBySlug } from "@/public/data";

export const dynamic = "force-dynamic";

type GalleryImage = { id: string; publicUrl: string | null; altText: string | null; width: number | null; height: number | null };

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [business, communication, service] = await Promise.all([getBusinessSettings(), getCommunicationSettings(), getServiceBySlug(slug)]);
  const gallery = "gallery" in service ? (service as { gallery: GalleryImage[] }).gallery : [];

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <Link href="/services" className="text-sm font-semibold text-primary underline underline-offset-4">All services</Link>

        {service.featuredImage?.publicUrl ? (
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border bg-surface">
            <img src={service.featuredImage.publicUrl} alt={service.featuredImage.altText ?? service.name} className="w-full object-cover" loading="lazy" />
          </div>
        ) : null}

        <div className="mt-6 rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
          <p className="text-sm font-semibold text-primary">{formatMoney(service.priceCents, business.currencySymbol)}{service.durationMinutes ? `, about ${service.durationMinutes} minutes` : ""}</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em]">{service.name}</h1>
          <p className="mt-5 max-w-[65ch] text-lg leading-8 text-muted-foreground">{service.fullDescription}</p>
          {service.safetyInformation ? <p className="mt-6 rounded-2xl bg-surface-muted p-5 text-sm leading-6 text-secondary-foreground">{service.safetyInformation}</p> : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {service.bookingEnabled ? <Link href="/book" className="flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Request booking</Link> : null}
            {communication.enableCalls ? <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold">Call centre</a> : null}
          </div>
        </div>
        {gallery.length > 0 ? (
          <section className="mt-8 rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">Gallery</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {gallery.map((img) => (
                <div key={img.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                  <img src={img.publicUrl ?? ""} alt={img.altText ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {service.faqs.length > 0 ? (
          <section className="mt-8 rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">Service FAQs</h2>
            <div className="mt-5 space-y-4">
              {service.faqs.map((faq) => (
                <article key={faq.id} className="rounded-2xl bg-surface-muted p-5">
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}
