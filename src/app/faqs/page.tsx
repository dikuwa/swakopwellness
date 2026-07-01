import type { Metadata } from "next";
import { AlertTriangle, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageShell } from "@/public/components";
import { getBusinessSettings, getCommunicationSettings, getPublicFaqs } from "@/public/data";
import { FaqAccordion } from "./faq-accordion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Frequently asked questions about Swakop Wellness Centre's services, booking process, and complementary wellness support.",
};

export default async function FaqsPage() {
  const [business, communication, faqs] = await Promise.all([getBusinessSettings(), getCommunicationSettings(), getPublicFaqs()]);

  return (
    <PageShell business={business} communication={communication}>
      <main>
        <section className="mx-auto max-w-7xl px-3 py-4 sm:px-5">
          <div className="overflow-hidden rounded-2xl bg-primary text-primary-foreground">
            <div className="bg-[linear-gradient(90deg,oklch(0.235_0.025_158_/_0.72),oklch(0.235_0.025_158_/_0.12)),url('/images/faq-room.png')] bg-cover bg-center px-8 py-20 sm:px-20">
              <p className="inline-flex rounded-full bg-primary-foreground/20 px-4 py-2 text-sm font-semibold">FAQ</p>
              <h1 className="mt-6 max-w-xl text-5xl font-semibold sm:text-6xl">Questions you might have</h1>
              <p className="mt-5 max-w-lg text-primary-foreground/82">Clear answers to help you feel informed, confident and cared for.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
          <FaqAccordion faqs={faqs} />
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-12 sm:px-8">
          <div className="grid gap-5 rounded-2xl border border-warning/25 bg-warning/10 p-6 md:grid-cols-[auto_1fr]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning"><AlertTriangle className="h-8 w-8" /></span>
            <div>
              <h2 className="text-2xl font-semibold">Important safety guidance</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{business.medicalDisclaimer}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                <li>Clients undergoing chemotherapy should postpone scanning.</li>
                <li>Clients taking strong medications (e.g., antibiotics) should postpone scanning.</li>
                <li>Clients with pacemakers or implanted electronic medical devices should postpone scanning.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-8">
          <div className="grid gap-6 rounded-2xl bg-surface-muted p-6 md:grid-cols-[1fr_1fr] md:items-center">
            <div className="flex gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><MessageCircle className="h-7 w-7" /></span>
              <div>
                <h2 className="text-2xl font-semibold">Still have questions?</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Our team is happy to answer your questions and guide you towards the right service for your needs.</p>
              </div>
            </div>
            <div className="space-y-3 border-border text-sm text-muted-foreground md:border-l md:pl-8">
              <p className="flex gap-2"><MapPin className="h-5 w-5 text-primary" />{business.address}</p>
              {communication.enableCalls ? <p className="flex gap-2"><Phone className="h-5 w-5 text-primary" />{communication.mainPhone}</p> : null}
              {communication.enableEmailContact ? <p className="flex gap-2"><Mail className="h-5 w-5 text-primary" />{communication.businessEmail}</p> : null}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
