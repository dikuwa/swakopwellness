import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BookOpen, HeartHandshake, Leaf, MapPin, ShieldCheck, Sparkles } from "lucide-react";
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
      <main>
        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-primary">About the centre</p>
            <h1 className="mt-5 text-5xl font-semibold sm:text-6xl">A calm, supportive place to understand your wellbeing.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {business.businessName} offers appointment-based complementary wellness assessments and frequency-based support in Swakopmund.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="aspect-[4/3] bg-[url('/images/faq-room.png')] bg-cover bg-center" aria-label="Warm wellness room with treatment bed and botanical styling" />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="grid gap-5 md:grid-cols-4">
            {[
              { title: "Natural Healing", desc: "Supportive wellness care with a gentle, non-invasive approach.", Icon: Leaf },
              { title: "Client-Centred Care", desc: "Appointments are personal, calm and guided by your needs.", Icon: HeartHandshake },
              { title: "Integrity & Safety", desc: "Clear suitability guidance and careful complementary-wellness wording.", Icon: ShieldCheck },
              { title: "Empowerment", desc: "Education and explanation so you can make informed choices.", Icon: BookOpen },
            ].map(({ title, desc, Icon }) => (
              <article key={title} className="rounded-2xl border border-border bg-surface p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-primary"><Icon className="h-5 w-5" /></span>
                <h2 className="mt-5 text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Our purpose</p>
            <h2 className="mt-3 text-3xl font-semibold">Guided understanding, not rushed appointments</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              The centre is built around careful assessment, clear communication and supportive follow-up. Services are designed to provide wellness insights and complementary support, not medical diagnosis.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["First visit", "We welcome you, confirm your details and explain what to expect."],
              ["Assessment", "Your selected non-invasive assessment or support session is completed."],
              ["Explanation", "Your practitioner discusses observations and wellness guidance."],
              ["Support", "Where appropriate, follow-up or frequency-based support may be suggested."],
            ].map(([title, desc]) => (
              <article key={title} className="rounded-2xl bg-surface-muted p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="grid gap-6 rounded-2xl border border-warning/25 bg-warning/10 p-6 md:grid-cols-[auto_1fr]">
            <AlertTriangle className="h-10 w-10 text-warning" />
            <div>
              <h2 className="text-2xl font-semibold">Important suitability information</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{business.medicalDisclaimer}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-16 sm:px-8 md:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-2xl font-semibold">Visit us</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              <p className="flex gap-2"><MapPin className="h-5 w-5 text-primary" />{business.address}</p>
              <p>{business.operatingHours}</p>
              <p>{business.appointmentModel}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
            <Sparkles className="h-8 w-8" />
            <h2 className="mt-4 text-2xl font-semibold">Ready to begin?</h2>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/75">Request an appointment online and our team will follow up to confirm.</p>
            <Link href="/book" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary-foreground px-5 text-sm font-semibold text-primary">Book appointment</Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
