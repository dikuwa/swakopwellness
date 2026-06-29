import Link from "next/link";
import { PageShell } from "@/public/components";
import { formatMoney, getBusinessSettings, getCommunicationSettings, getPublicServices } from "@/public/data";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [business, communication, services] = await Promise.all([getBusinessSettings(), getCommunicationSettings(), getPublicServices()]);

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h1 className="text-5xl font-semibold tracking-[-0.05em]">Services</h1>
        <p className="mt-4 max-w-[65ch] text-muted-foreground">Prices and service details are loaded from editable service records.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <article key={service.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-[-0.035em]">{service.name}</h2>
                <p className="text-sm font-semibold text-primary">{formatMoney(service.priceCents, business.currencySymbol)}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.shortDescription}</p>
              <div className="mt-5 flex gap-3">
                <Link href={`/services/${service.slug}`} className="text-sm font-semibold text-primary underline underline-offset-4">Details</Link>
                {service.bookingEnabled ? <Link href="/book" className="text-sm font-semibold text-primary underline underline-offset-4">Book</Link> : null}
              </div>
            </article>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
