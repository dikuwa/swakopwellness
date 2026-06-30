import type { Metadata } from "next";
import { PageShell } from "@/public/components";
import { getBusinessSettings, getCommunicationSettings } from "@/public/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Swakop Wellness Centre in Swakopmund, Namibia — our approach, practice details, and commitment to complementary wellness support.",
};

export default async function AboutPage() {
  const [business, communication] = await Promise.all([getBusinessSettings(), getCommunicationSettings()]);

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-5xl font-semibold tracking-[-0.05em]">About {business.businessName}</h1>
        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_0.8fr]">
          <section className="rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
            <p className="text-lg leading-8 text-muted-foreground">
              {business.businessName} offers complementary wellness assessments and support services by appointment. The platform keeps services, prices and safety wording editable by authorised staff.
            </p>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">{business.medicalDisclaimer}</p>
          </section>
          <aside className="rounded-[1.5rem] bg-surface-muted p-6 text-sm leading-6 text-secondary-foreground sm:p-8">
            <p className="font-semibold text-foreground">Practice details</p>
            <p className="mt-3">{business.address}</p>
            <p className="mt-3">{business.operatingHours}</p>
            <p className="mt-3">{business.appointmentModel}</p>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
