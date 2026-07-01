import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageShell } from "@/public/components";
import { getBusinessSettings, getCommunicationSettings } from "@/public/data";
import { submitContactMessage } from "./actions";
import { ContactForm } from "./contact-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Swakop Wellness Centre by phone or email. Located in Swakopmund, Namibia.",
};

export default async function ContactPage() {
  const [business, communication] = await Promise.all([getBusinessSettings(), getCommunicationSettings()]);

  return (
    <PageShell business={business} communication={communication}>
      <main>
        <section className="mx-auto max-w-5xl px-5 py-16 text-center sm:px-8">
          <p className="inline-flex rounded-full bg-surface-muted px-4 py-2 text-sm font-semibold text-primary">Get in touch</p>
          <h1 className="mt-5 text-5xl font-semibold sm:text-6xl">Contact Us</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">We are here to help. Reach out with any questions or to book your first session.</p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-8">
            <div className="grid min-h-72 place-items-center rounded-2xl bg-[linear-gradient(135deg,oklch(0.924_0.025_116),oklch(0.988_0.009_85))] p-6 text-center text-sm text-muted-foreground">
              <span>{business.address}</span>
            </div>
            <div className="mt-6 min-w-0 divide-y divide-border text-sm">
              <p className="flex gap-4 py-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary"><MapPin className="h-5 w-5" /></span><span>{business.address}</span></p>
              {communication.enableCalls ? <p className="flex gap-4 py-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary"><Phone className="h-5 w-5" /></span><a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`}>{communication.mainPhone}</a></p> : null}
              {communication.enableEmailContact ? <p className="flex gap-4 py-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary"><Mail className="h-5 w-5" /></span><a href={`mailto:${communication.businessEmail}`} className="break-all">{communication.businessEmail}</a></p> : null}
              <p className="flex gap-4 py-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary"><Clock className="h-5 w-5" /></span><span>{business.operatingHours}</span></p>
              <p className="flex gap-4 py-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary"><CalendarDays className="h-5 w-5" /></span><span>{business.appointmentModel}</span></p>
            </div>
          </aside>

          <section className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-8">
            <ContactForm action={submitContactMessage} />
          </section>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="overflow-hidden rounded-2xl bg-primary text-primary-foreground">
            <div className="bg-[linear-gradient(90deg,oklch(0.235_0.025_158_/_0.70),oklch(0.235_0.025_158_/_0.20)),url('/images/contact-room.png')] bg-cover bg-center px-6 py-12 sm:px-10">
              <h2 className="text-3xl font-semibold">Ready to feel more balanced?</h2>
              <p className="mt-2 text-primary-foreground/80">Book an appointment online or call us to get started.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/book" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground ring-1 ring-primary-foreground/10">Book appointment</Link>
                {communication.enableCalls ? <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-primary-foreground/55 px-5 text-sm font-semibold">Call us</a> : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
