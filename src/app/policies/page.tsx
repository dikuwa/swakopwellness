import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, CreditCard, HeartPulse, Info, Leaf, LockKeyhole, UserRound } from "lucide-react";
import { PageShell } from "@/public/components";
import { getBusinessSettings, getCommunicationSettings, getPublicPolicies } from "@/public/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Policies",
  description: "Read Swakop Wellness Centre's policies and complementary wellness disclaimers.",
};

export default async function PoliciesPage() {
  const [business, communication, policies] = await Promise.all([getBusinessSettings(), getCommunicationSettings(), getPublicPolicies()]);
  const byTitle = new Map(policies.map((policy) => [policy.title.toLowerCase(), policy.body]));
  const cards = [
    {
      title: "Complementary Wellness Disclaimer",
      body: byTitle.get("terms of service") ?? business.medicalDisclaimer,
      icon: Leaf,
    },
    {
      title: "Suitability Assessment",
      body: "A suitability assessment may be conducted before a session. Please inform us of relevant medical conditions, implanted electronic devices, chemotherapy, strong medication, pregnancy or other concerns before your appointment.",
      icon: HeartPulse,
    },
    {
      title: "Appointment Policy",
      body: `Appointments are subject to availability and must be requested in advance. ${business.appointmentModel}.`,
      icon: CalendarDays,
    },
    {
      title: "Cancellation Policy",
      body: byTitle.get("cancellation policy") ?? "Please contact us directly if you need to cancel or reschedule your appointment.",
      icon: Clock,
    },
    {
      title: "Payment Policy",
      body: "Payment is due at the time of your appointment unless otherwise arranged. Receipts can be issued for payments received.",
      icon: CreditCard,
    },
    {
      title: "Privacy & Confidentiality",
      body: byTitle.get("privacy policy") ?? "Client information is handled carefully and used for providing wellness services and related communication.",
      icon: LockKeyhole,
    },
    {
      title: "Client Responsibility",
      body: "Clients are responsible for providing accurate information during suitability screening and for informing us of changes to their health status between sessions.",
      icon: UserRound,
    },
  ];

  return (
    <PageShell business={business} communication={communication}>
      <main>
        <section className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8">
          <p className="inline-flex rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-primary">Policies</p>
          <h1 className="mt-5 text-5xl font-semibold sm:text-6xl">Policies &amp; Disclaimers</h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">Important information about how we work, what to expect, and your responsibilities as a client.</p>
        </section>

        <section className="mx-auto max-w-4xl space-y-4 px-5 pb-10 sm:px-8">
          {cards.map(({ title, body, icon: Icon }) => (
            <article key={title} className="grid gap-5 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-[auto_1fr]">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-primary"><Icon className="h-8 w-8" /></span>
              <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-8">
          <div className="grid gap-5 rounded-2xl border border-warning/25 bg-warning/10 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <p className="flex gap-3 text-sm leading-6 text-muted-foreground"><Info className="mt-0.5 h-5 w-5 shrink-0 text-warning" /><span><strong className="text-foreground">Important:</strong> If you have questions about these policies or your specific situation, please contact us before booking.</span></p>
            <Link href="/contact" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Get in touch</Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
