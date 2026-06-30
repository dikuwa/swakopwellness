import Link from "next/link";
import { eq, isNull } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { services, serviceCategories } from "@/db/schema";
import { DashboardLayout } from "@/dashboard/components";
import {
  archiveService,
  toggleServiceActive,
  toggleServicePublic,
} from "@/services/actions";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  await requirePermission("services:manage");
  const db = getDb();

  const allServices = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      categoryName: serviceCategories.name,
      priceCents: services.priceCents,
      durationMinutes: services.durationMinutes,
      active: services.active,
      publicVisible: services.publicVisible,
      featured: services.featured,
      sortOrder: services.sortOrder,
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(isNull(services.archivedAt))
    .orderBy(services.sortOrder);

  return (
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Services</p>
          <h1 className="mt-2 text-2xl sm:text-3xl tracking-[-0.03em]">Services</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/services/categories"
            className="flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            Categories
          </Link>
          <Link
            href="/dashboard/services/suitability"
            className="flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            Suitability
          </Link>
          <Link
            href="/dashboard/services/new"
            className="flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            New Service
          </Link>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-3">Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Active</th>
              <th>Public</th>
              <th>Featured</th>
              <th>Sort</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allServices.map((s) => (
              <tr
                key={s.id}
                className="border-t border-border hover:bg-surface-muted/50"
              >
                <td className="py-3 font-medium">{s.name}</td>
                <td className="text-muted-foreground">
                  {s.categoryName ?? "\u2014"}
                </td>
                <td>N${(s.priceCents / 100).toFixed(0)}</td>
                <td className="text-muted-foreground">
                  {s.durationMinutes
                    ? `${s.durationMinutes} min`
                    : "\u2014"}
                </td>
                <td>
                  <form action={toggleServiceActive.bind(null, s.id)}>
                    <button
                      type="submit"
                      className={`inline-block cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        s.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.active ? "Yes" : "No"}
                    </button>
                  </form>
                </td>
                <td>
                  <form action={toggleServicePublic.bind(null, s.id)}>
                    <button
                      type="submit"
                      className={`inline-block cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        s.publicVisible
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.publicVisible ? "Yes" : "No"}
                    </button>
                  </form>
                </td>
                <td>{s.featured ? "\u2605" : "\u2606"}</td>
                <td className="text-muted-foreground">{s.sortOrder}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/services/${s.id}/edit`}
                      className="flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-muted"
                    >
                      Edit
                    </Link>
                    <form action={archiveService.bind(null, s.id)}>
                      <button
                        type="submit"
                        className="flex h-8 cursor-pointer items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        Archive
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {allServices.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No services yet.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
    </DashboardLayout>
  );
}
