import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Phone } from "lucide-react";
import { PageShell } from "@/public/components";
import { getActiveSuitabilityQuestions, getBookingRules, getBusinessSettings, getCommunicationSettings, getPublicServices } from "@/public/data";
import { submitBookingRequest } from "./actions";
import { BookingFlow } from "./booking-flow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Request an appointment at Swakop Wellness Centre. Choose a service, preferred time, and submit your details for staff review.",
};

export default async function BookPage({ searchParams }: { searchParams: Promise<{ reference?: string; status?: string; error?: string; service?: string }> }) {
  const params = await searchParams;
  const [business, communication, services, rules, questions] = await Promise.all([
    getBusinessSettings(),
    getCommunicationSettings(),
    getPublicServices(),
    getBookingRules(),
    getActiveSuitabilityQuestions(),
  ]);
  const bookableServices = services.filter((service) => service.bookingEnabled);
  const initialServiceId = params.service ? bookableServices.find((service) => service.slug === params.service)?.id : undefined;
  const successStatus = params.status === "requires_review" ? "Your request was received and marked for staff review." : "Your request was received.";

  return (
    <PageShell business={business} communication={communication}>
      <main className="px-5 py-12 sm:px-8">
        {params.reference ? (
          <section className="mx-auto max-w-3xl py-12 text-center" role="status">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-14 w-14" aria-hidden="true" />
            </div>
            <h1 className="mt-8 text-5xl font-semibold sm:text-6xl">Booking request sent!</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              {successStatus} A team member will contact you to confirm your booking, typically within business hours.
            </p>
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-border bg-surface p-6 text-left shadow-[0_10px_40px_oklch(0.235_0.025_158_/_0.05)]">
              <p className="text-sm font-semibold text-primary">Your request reference</p>
              <p className="mt-2 text-3xl font-semibold">{params.reference}</p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">Keep this reference for follow-up calls or email communication.</p>
            </div>
            {communication.enableCalls ? (
              <p className="mt-8 inline-flex items-center gap-2 text-muted-foreground">
                <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
                Need to change something? Call us at <a href={`tel:${communication.mainPhone.replaceAll(" ", "")}`} className="font-semibold text-primary">{communication.mainPhone}</a>.
              </p>
            ) : null}
            <div className="mt-8">
              <Link href="/" className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-surface-muted">Return home</Link>
            </div>
          </section>
        ) : (
          <>
            <section className="mx-auto mb-10 max-w-6xl overflow-hidden rounded-2xl border border-border bg-primary text-primary-foreground">
              <div className="grid min-h-64 bg-[linear-gradient(90deg,oklch(0.235_0.025_158_/_0.75),oklch(0.235_0.025_158_/_0.20)),url('/images/faq-room.png')] bg-cover bg-center p-8 sm:p-12">
                <div className="max-w-xl self-center">
                  <p className="text-sm font-semibold uppercase text-primary-foreground/75">Book Appointment</p>
                  <h1 className="display-tight mt-4 text-4xl font-semibold sm:text-5xl">Your wellness journey starts here.</h1>
                  <p className="mt-4 text-primary-foreground/80">Submitted times are requests only. Staff will review availability and contact you before an appointment is confirmed.</p>
                </div>
              </div>
            </section>
            {params.error ? (
              <section className="mx-auto mb-8 max-w-6xl rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive" role="alert">
                {params.error}
              </section>
            ) : null}
            <BookingFlow
              action={submitBookingRequest}
              services={bookableServices}
              questions={questions}
              currencySymbol={business.currencySymbol}
              openingTime={rules.openingTime}
              closingTime={rules.closingTime}
              timezone={rules.timezone}
              enableCalls={communication.enableCalls}
              enableEmailContact={communication.enableEmailContact}
              initialServiceId={initialServiceId}
            />
          </>
        )}
      </main>
    </PageShell>
  );
}
