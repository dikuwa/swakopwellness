import { PageShell } from "@/public/components";
import { getBusinessSettings, getCommunicationSettings, getPublicServices } from "@/public/data";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const [business, communication, services] = await Promise.all([getBusinessSettings(), getCommunicationSettings(), getPublicServices()]);

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-5xl font-semibold tracking-[-0.05em]">Book an appointment</h1>
        <section className="mt-8 rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
          <p className="max-w-[65ch] text-sm leading-6 text-muted-foreground">
            The multi-step booking request form starts in Phase 4. The services below are already loaded from the shared database and ready for booking workflow integration.
          </p>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {services.filter((service) => service.bookingEnabled).map((service) => (
              <li key={service.id} className="rounded-2xl bg-surface-muted p-4 text-sm font-medium text-secondary-foreground">{service.name}</li>
            ))}
          </ul>
        </section>
      </main>
    </PageShell>
  );
}
