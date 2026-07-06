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

  return (
    <DashboardShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              Services
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.035em]">
              Service Categories
            </h1>
          </div>
        </div>

        <CreateCategoryForm createAction={createServiceCategory} />

        <div className="mt-6 space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="rounded-xl border border-border bg-background p-5">
              <EditCategoryForm
                category={{ id: category.id, name: category.name, slug: category.slug, description: category.description, sortOrder: category.sortOrder }}
                updateAction={updateServiceCategory}
              />
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <form action={toggleServiceCategoryActive.bind(null, category.id)}>
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      category.active
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${category.active ? "bg-green-600" : "bg-red-600"}`} />
                    {category.active ? "Active" : "Inactive"}
                  </button>
                </form>
                <form action={deleteOrArchiveServiceCategory.bind(null, category.id)}>
                  <button
                    type="submit"
                    className="flex h-8 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    Delete / Archive
                  </button>
                </form>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="rounded-xl border border-border bg-background p-8 text-center text-sm text-muted-foreground">
              No service categories yet.
            </div>
          )}
        </div>
    </DashboardShell>
  );
}
