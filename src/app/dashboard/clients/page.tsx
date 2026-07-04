import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getClients } from "@/dashboard/data";
import { Pagination } from "@/ui/pagination";
import { SearchInput } from "@/ui/search-input";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clients — Swakop Wellness Centre",
};

export default async function DashboardClientsPage(props: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requirePermission("clients:view");
  const { page: pageStr, q } = await props.searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const { rows: clients, total } = await getClients(page, 25, q);
  const totalPages = Math.ceil(total / 25);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
          <h1 className="mt-2 text-2xl sm:text-3xl tracking-[-0.03em]">Clients</h1>
        </div>
        <div className="w-64">
          <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-xl bg-surface-muted" />}>
            <SearchInput placeholder="Search by name, phone, email..." />
          </Suspense>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-3">Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Preferred Contact</th>
              <th>Last Booking</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t border-border">
                <td className="py-3 font-medium">
                  <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                    {client.fullName}
                  </Link>
                </td>
                <td>{client.phone ?? "—"}</td>
                <td>{client.email ?? "—"}</td>
                <td>{client.preferredContactMethod.replaceAll("_", " ")}</td>
                <td>{client.lastBookingAt ? client.lastBookingAt.toLocaleDateString("en-GB") : "—"}</td>
                <td>{client.createdAt.toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {clients.length === 0 ? <p className="mt-6 text-muted-foreground">No clients found.</p> : null}
      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/clients" />
    </DashboardShell>
  );
}
