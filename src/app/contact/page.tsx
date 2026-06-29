import { PageShell } from "@/public/components";
import { getBusinessSettings, getCommunicationSettings } from "@/public/data";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const [business, communication] = await Promise.all([getBusinessSettings(), getCommunicationSettings()]);

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-5xl font-semibold tracking-[-0.05em]">Contact</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">Reach the centre</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>{business.address}</p>
              {communication.enableCalls ? <p>{communication.mainPhone}</p> : null}
              {communication.enableEmailContact ? <p>{communication.businessEmail}</p> : null}
              <p>{business.operatingHours}</p>
            </div>
          </section>
          <section className="rounded-[1.5rem] bg-surface-muted p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">Appointments</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{business.appointmentModel}. Online booking requests are implemented in the next phase; for now, use the enabled contact options.</p>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
