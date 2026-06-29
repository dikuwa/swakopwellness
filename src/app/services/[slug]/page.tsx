import Link from "next/link";
import { PageShell } from "@/public/components";
import { formatMoney, getBusinessSettings, getCommunicationSettings, getServiceBySlug } from "@/public/data";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [business, communication, service] = await Promise.all([getBusinessSettings(), getCommunicationSettings(), getServiceBySlug(slug)]);

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <Link href="/services" className="text-sm font-semibold text-primary underline underline-offset-4">All services</Link>
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
      </main>
    </PageShell>
  );
}
