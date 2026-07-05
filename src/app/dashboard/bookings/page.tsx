import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDashboardBookings } from "@/dashboard/data";
import { SearchInput } from "@/ui/search-input";
import { BookingsClientView } from "./bookings-client-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bookings — Swakop Wellness Centre",
};

export default async function DashboardBookingsPage(props: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requirePermission("bookings:view");
  const { page: pageStr, q } = await props.searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const { rows: bookings, total } = await getDashboardBookings(page, 25, q);
  const totalPages = Math.ceil(total / 25);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
          <h1 className="mt-2 text-2xl sm:text-3xl tracking-[-0.03em]">Bookings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review requests, update statuses and add manual bookings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-64">
            <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-xl bg-surface-muted" />}>
              <SearchInput placeholder="Search by client, ref, service..." />
            </Suspense>
          </div>
          <Link href="/dashboard/bookings/new" className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_oklch(0.355_0.074_159_/_0.25)] transition-all duration-200 hover:bg-primary/90">
            New Booking
          </Link>
        </div>
      </div>
      <BookingsClientView initialBookings={bookings} totalPages={totalPages} page={page} />
    </DashboardShell>
  );
}