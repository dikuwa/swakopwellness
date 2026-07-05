import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getActiveSuitabilityQuestionsForDashboard, getBookableServicesForManualUse } from "@/dashboard/data";
import { getBookingRules, getCommunicationSettings } from "@/public/data";
import { ManualBookingForm } from "./manual-booking-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Booking — Dashboard",
};

export default async function NewManualBookingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requirePermission("bookings:create");
  const params = await searchParams;
  const [services, questions, rules, communication] = await Promise.all([
    getBookableServicesForManualUse(),
    getActiveSuitabilityQuestionsForDashboard(),
    getBookingRules(),
    getCommunicationSettings(),
  ]);

  return (
    <DashboardShell>
      <Link href="/dashboard/bookings" className="text-sm text-muted-foreground hover:text-foreground">&larr; Bookings</Link>
        <div className="mt-3 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Add Manual Booking</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use this for phone or in-person requests. The booking is still saved as a request unless staff confirms it afterwards.
          </p>
        </div>

        <ManualBookingForm
          services={services}
          questions={questions}
          rules={rules}
          communication={communication}
          error={params.error}
        />
    </DashboardShell>
  );
}
