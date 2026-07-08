import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarDays, Clock, Heart, Mail, MapPin, Phone, Send, ShieldCheck, Sprout, Stethoscope } from "lucide-react";
import { ContactForm } from "@/app/contact/contact-form";
import { submitContactMessage } from "@/app/contact/actions";
import { DiacomSection } from "@/public/diacom-section";
import { PageShell } from "@/public/components";
import { formatMoney, getBusinessSettings, getCommunicationSettings, getFeaturedServices, getPublicFaqs } from "@/public/data";
import { formatServiceTitle } from "@/public/service-title";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Swakop Wellness Centre",
  description: "Complementary wellness services, health assessments and frequency-based wellness support in Swakopmund, Namibia. Book an appointment online.",
};

export default async function Home() {
  const [business, communication, services, faqs] = await Promise.all([
    getBusinessSettings(),
    getCommunicationSettings(),
    getFeaturedServices(),
    getPublicFaqs(),
  ]);

  return (
    <PageShell business={business} communication={communication} flushTop>
      <main>
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.235_0.025_158_/_0.75),oklch(0.235_0.025_158_/_0.15)),url('/images/wellness-room.png')] bg-cover bg-center" />
          <div className="relative mx-auto max-w-7xl px-3 pb-8 pt-24 sm:px-5 sm:pb-12">
            <div className="min-h-[520px] px-6 py-16 sm:px-12 lg:px-20">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary-foreground/75">By appointment only</p>
                <h1 className="display-tight mt-5 text-5xl font-semibold leading-[0.95] sm:text-7xl">Wellness support, guided by careful assessment.</h1>
                <p className="mt-6 max-w-xl text-sm leading-7 text-primary-foreground/85 sm:text-base">
                  Using the Diacom Lite Freq Utium, an FCC‑certified bioresonance scanner, we gently scan your body to uncover root causes of imbalance and guide personalised wellness support. All appointments are by request and confirmed by our team.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/book" className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_oklch(0.235_0.025_158_/_0.18)] ring-1 ring-primary-foreground/15 transition-all duration-200 hover:shadow-[0_14px_32px_oklch(0.235_0.025_158_/_0.28)]">
                    Book appointment
                  </Link>
                  {communication.enableCalls ? (
                    <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="inline-flex h-12 min-w-[130px] items-center justify-center gap-2 rounded-xl bg-primary-foreground/15 px-6 text-sm font-semibold text-primary-foreground ring-1 ring-primary-foreground/10 backdrop-blur transition-all duration-200 hover:bg-primary-foreground/25">
                      <Phone className="h-4 w-4" /> Call now
                    </a>
                  ) : null}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/12 px-4 py-2 text-xs text-primary-foreground/85 backdrop-blur"><Clock className="h-3.5 w-3.5" />{business.operatingHours}</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/12 px-4 py-2 text-xs text-primary-foreground/85 backdrop-blur"><CalendarDays className="h-3.5 w-3.5" />{business.appointmentModel}</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/12 px-4 py-2 text-xs text-primary-foreground/85 backdrop-blur"><MapPin className="h-3.5 w-3.5" />{business.address}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-primary"><Sprout className="h-4 w-4" /> Our services</p>
              <h2 className="display-tight mt-3 text-3xl font-semibold sm:text-4xl">Non-invasive wellness support</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Carefully designed assessments and frequency-based support to help you feel more balanced and in control of your wellbeing.</p>
            </div>
            <Link href="/services" className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-muted">View all services</Link>
          </div>
          <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="group block h-full cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`View ${formatServiceTitle(service.name, service.slug)}`}
              >
              <article className="flex h-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_oklch(0.235_0.025_158_/_0.04)] transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:border-primary/25 group-hover:shadow-[0_18px_45px_oklch(0.235_0.025_158_/_0.12)]">
                <div className="flex min-h-full w-full flex-col">
                  {service.featuredImage ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#f7f1e8]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- media URLs are administrator-managed public URLs. */}
                      <img
                        src={service.featuredImage.publicUrl}
                        alt={service.featuredImage.altText ?? formatServiceTitle(service.name, service.slug)}
                        className="h-full w-full object-cover object-center saturate-[0.92] contrast-[0.96] brightness-[0.98] transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10 mix-blend-multiply" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fbf7ef]/88 via-[#fbf7ef]/35 to-transparent" />
                      <div className="pointer-events-none absolute inset-0 bg-[#f8f2e8]/10" />
                      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/10" />
                    </div>
                  ) : (
                    <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,oklch(0.924_0.025_116),oklch(0.988_0.009_85))]">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/20 to-accent/15" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fbf7ef]/88 via-[#fbf7ef]/35 to-transparent" />
                    </div>
                  )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{formatServiceTitle(service.name, service.slug)}</h3>
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10">{formatMoney(service.priceCents, business.currencySymbol)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.shortDescription}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{service.durationMinutes ?? 30} minutes</span>
                    <span className="font-semibold text-primary transition-colors group-hover:text-primary/85">Learn more</span>
                  </div>
                </div>
                </div>
              </article>
              </Link>
            ))}
          </div>
        </section>

        <DiacomSection business={business} />

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="rounded-2xl bg-surface-muted p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase text-primary">How appointments work</p>
            <h2 className="display-tight mt-3 text-3xl font-semibold">Your wellness journey, step by step</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-4">
              {[
                { title: "Choose a service", desc: "Browse services and select the one that best suits your needs.", Icon: CalendarDays },
                { title: "Request a time", desc: "Share your availability and we will confirm your appointment.", Icon: Send },
                { title: "Visit the centre", desc: "Attend your appointment at our Swakopmund location.", Icon: MapPin },
                { title: "Receive support", desc: "Get your assessment and personalised wellness support.", Icon: Heart },
              ].map(({ title, desc, Icon }) => (
                <div key={title} className="rounded-2xl bg-surface p-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-primary"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 sm:px-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Why choose Swakop Wellness</p>
            <h2 className="display-tight mt-3 text-3xl font-semibold">Care that sees the whole you</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                { title: "Root‑cause focus", desc: "We don\u2019t just soothe symptoms; our scans look deeper to uncover the underlying imbalances behind fatigue, discomfort or chronic issues.", Icon: Stethoscope },
                { title: "Safe & certified technology", desc: "Our Diacom device is FCC\u2011certified and non\u2011invasive, suitable for adults and children and free from needles or radiation.", Icon: ShieldCheck },
                { title: "Personalised insights", desc: "You\u2019ll receive a clear report and tailored recommendations based on your body\u2019s unique frequency patterns.", Icon: Heart },
                { title: "Supportive guidance", desc: "Experienced practitioners explain your results and provide targeted frequency therapy or dietary advice to restore balance.", Icon: Sprout },
              ].map(({ title, desc, Icon }) => (
                <div key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary"><Icon className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-2xl border border-warning/25 bg-warning/10 p-6">
            <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5 text-warning" /> Important - please read</p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{business.medicalDisclaimer}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">If you have a medical condition or are under medical care, please consult your healthcare provider before booking.</p>
          </aside>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">FAQ</p>
              <h2 className="display-tight mt-3 text-3xl font-semibold">Questions you might have</h2>
            </div>
            <Link href="/faqs" className="hidden h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-muted sm:inline-flex">View all FAQs</Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {faqs.slice(0, 4).map((faq) => (
              <Link key={faq.id} href="/faqs" className="rounded-xl border border-border bg-surface p-4 text-sm font-semibold hover:bg-surface-muted">{faq.question}</Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <p className="text-xs font-semibold uppercase text-primary">Visit us</p>
          <h2 className="display-tight mt-3 text-3xl font-semibold">Contact &amp; Location</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="grid min-h-48 place-items-center rounded-xl bg-[linear-gradient(135deg,oklch(0.924_0.025_116),oklch(0.988_0.009_85))] text-center text-sm text-muted-foreground">
                <span>{business.address}</span>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
                <p className="flex gap-2"><MapPin className="h-5 w-5 text-primary" />{business.address}</p>
                {communication.enableCalls ? <p className="flex gap-2"><Phone className="h-5 w-5 text-primary" />{communication.mainPhone}</p> : null}
                {communication.enableEmailContact ? <p className="flex gap-2"><Mail className="h-5 w-5 text-primary" />{communication.businessEmail}</p> : null}
                <p className="flex gap-2"><Clock className="h-5 w-5 text-primary" />{business.operatingHours} - {business.appointmentModel}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="font-semibold">Send us a message</h3>
              <p className="mt-1 text-sm text-muted-foreground">We will get back to you to confirm your appointment.</p>
              <div className="mt-5">
                <ContactForm action={submitContactMessage} />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <div className="overflow-hidden rounded-2xl bg-primary text-primary-foreground">
            <div className="bg-[linear-gradient(90deg,oklch(0.235_0.025_158_/_0.70),oklch(0.235_0.025_158_/_0.20)),url('/images/contact-room.png')] bg-cover bg-center px-6 py-12 text-center sm:px-10">
              <h2 className="display-tight text-3xl font-semibold">Ready to feel more balanced?</h2>
              <p className="mx-auto mt-2 max-w-2xl text-primary-foreground/80">Book an appointment online or call us to get started.</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/book" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground ring-1 ring-primary-foreground/10">Book appointment</Link>
                {communication.enableCalls ? <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-primary-foreground/55 px-5 text-sm font-semibold">Call now</a> : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
