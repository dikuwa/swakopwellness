import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { serviceCategories } from "@/db/schema";
import { DashboardShell } from "@/dashboard/shell";
import {
  createServiceCategory,
  deleteOrArchiveServiceCategory,
  toggleServiceCategoryActive,
  updateServiceCategory,
} from "@/services/actions";
import { CreateCategoryForm, EditCategoryForm } from "./category-form";
import { ClientCategoryRow } from "./client-category-row";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Service Categories — Dashboard",
};

export default async function ServiceCategoriesPage() {
  await requirePermission("services:manage");
  const db = getDb();

  const categories = await db
    .select()
    .from(serviceCategories)
    .orderBy(asc(serviceCategories.sortOrder), asc(serviceCategories.name));

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.active).length;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Services</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Service Categories</h1>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-3 max-w-lg">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="text-lg font-bold">{totalCategories}</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-sm font-bold tracking-tight mt-0.5">Categories</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <span className="text-lg font-bold">{activeCategories}</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active</p>
            <p className="text-sm font-bold tracking-tight mt-0.5">Categories</p>
          </div>
        </div>
      </div>

      {/* Add Category card */}
      <div className="mt-6 rounded-xl border border-border bg-background p-6">
        <h2 className="text-lg font-semibold">Add Category</h2>
        <CreateCategoryForm createAction={createServiceCategory} />
      </div>

      {/* Existing Categories card */}
      <div className="mt-6 rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-semibold">Existing Categories</h2>
        </div>
        {categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No service categories yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Slug</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold text-center">Sort</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((category) => (
                  <ClientCategoryRow
                    key={category.id}
                    category={category}
                    updateAction={updateServiceCategory}
                    toggleAction={toggleServiceCategoryActive}
                    archiveAction={deleteOrArchiveServiceCategory}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
