import Link from "next/link";
import type { Metadata } from "next";
import { eq, isNull } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { services, serviceCategories, mediaAssets } from "@/db/schema";
import { DashboardShell } from "@/dashboard/shell";
import { getMediaUrl } from "@/lib/media-url";
import {
  archiveService,
  toggleServiceActive,
  toggleServicePublic,
} from "@/services/actions";
import { ServiceActions, ServiceActiveForm, ServicePublicForm } from "./service-row-actions";
import {
  Layers,
  CheckCircle2,
  Clock,
  Star,
  Plus,
  Tag,
  Sliders,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services — Swakop Wellness Centre",
};

export default async function ServicesPage() {
  await requirePermission("services:manage");
  const db = getDb();

  const allServices = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      shortDescription: services.shortDescription,
      categoryName: serviceCategories.name,
      priceCents: services.priceCents,
      durationMinutes: services.durationMinutes,
      active: services.active,
      publicVisible: services.publicVisible,
      featured: services.featured,
      sortOrder: services.sortOrder,
      featuredImageId: mediaAssets.id,
      featuredImageUrl: mediaAssets.publicUrl,
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .leftJoin(mediaAssets, eq(services.featuredImageId, mediaAssets.id))
    .where(isNull(services.archivedAt))
    .orderBy(services.sortOrder);

  const totalServices = allServices.length;
  const activeServices = allServices.filter((s) => s.active).length;
  const featuredServices = allServices.filter((s) => s.featured).length;
  const avgDuration = totalServices > 0
    ? Math.round(allServices.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / (allServices.filter((s) => s.durationMinutes).length || 1))
    : 0;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">SERVICES</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Services</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/services/categories"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            <Tag className="h-4 w-4" />
            Categories
          </Link>
          <Link
            href="/dashboard/services/suitability"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            <Sliders className="h-4 w-4" />
            Suitability
          </Link>
          <Link
            href="/dashboard/services/new"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Link>
        </div>
      </div>

      {/* Stats Summary Card Bar */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Services</p>
            <p className="text-xl font-bold tracking-tight mt-0.5">{totalServices}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active</p>
            <p className="text-xl font-bold tracking-tight mt-0.5">{activeServices}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avg. Duration</p>
            <p className="text-xl font-bold tracking-tight mt-0.5">{avgDuration} min</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Featured</p>
            <p className="text-xl font-bold tracking-tight mt-0.5">{featuredServices}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-muted text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Service Name</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Price</th>
                <th className="py-3 px-4 font-semibold">Duration</th>
                <th className="py-3 px-4 font-semibold">Active</th>
                <th className="py-3 px-4 font-semibold">Public</th>
                <th className="py-3 px-4 font-semibold">Featured</th>
                <th className="py-3 px-4 font-semibold text-center">Sort</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allServices.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-surface-muted/30 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
                        {s.featuredImageId ? (
                          <img
                            src={getMediaUrl({ id: s.featuredImageId, publicUrl: s.featuredImageUrl })}
                            alt={s.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                            <Layers className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block text-sm">{s.name}</span>
                        <span className="text-xs text-muted-foreground block max-w-[320px] truncate mt-0.5">
                          {s.shortDescription || "No short description"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {s.categoryName ?? "\u2014"}
                  </td>
                  <td className="py-3.5 px-4 font-medium">N${(s.priceCents / 100).toFixed(0)}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {s.durationMinutes
                      ? `${s.durationMinutes} min`
                      : "\u2014"}
                  </td>
                  <td className="py-3.5 px-4">
                    <ServiceActiveForm action={toggleServiceActive.bind(null, s.id)} active={s.active} />
                  </td>
                  <td className="py-3.5 px-4">
                    <ServicePublicForm action={toggleServicePublic.bind(null, s.id)} publicVisible={s.publicVisible} />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.featured ? "text-amber-700 bg-amber-50" : "text-muted-foreground bg-surface-muted"}`}>
                      <Star className={`h-3 w-3 ${s.featured ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                      {s.featured ? "Featured" : "Standard"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-muted-foreground font-mono text-xs">{s.sortOrder}</td>
                  <td className="py-3.5 px-4">
                    <ServiceActions serviceId={s.id} archiveAction={archiveService.bind(null, s.id)} />
                  </td>
                </tr>
              ))}
              {allServices.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No services yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
