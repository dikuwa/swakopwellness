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

        <form
          action={async (formData) => { "use server"; await createServiceCategory(formData); }}
          className="mt-6 grid gap-4 rounded-xl border border-border bg-background p-4 lg:grid-cols-[1fr_1fr_2fr_120px_auto]"
        >
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
              Name *
            </label>
            <input
              id="name"
              name="name"
              required
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label htmlFor="slug" className="mb-1.5 block text-sm font-semibold">
              Slug
            </label>
            <input
              id="slug"
              name="slug"
              placeholder="Auto-generated"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-semibold"
            >
              Description
            </label>
            <input
              id="description"
              name="description"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label
              htmlFor="sortOrder"
              className="mb-1.5 block text-sm font-semibold"
            >
              Sort
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={0}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-xl border border-border bg-background p-4"
            >
              <form
                action={async (formData) => { "use server"; await updateServiceCategory(category.id, formData); }}
                className="grid gap-4 lg:grid-cols-[1fr_1fr_2fr_120px_auto]"
              >
                <input
                  name="name"
                  defaultValue={category.name}
                  required
                  aria-label="Category name"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  name="slug"
                  defaultValue={category.slug}
                  aria-label="Category slug"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  name="description"
                  defaultValue={category.description ?? ""}
                  aria-label="Category description"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={category.sortOrder}
                  aria-label="Category sort order"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  className="flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
                >
                  Update
                </button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={toggleServiceCategoryActive.bind(null, category.id)}>
                  <button
                    type="submit"
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                      category.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {category.active ? "Active" : "Inactive"}
                  </button>
                </form>
                <form action={deleteOrArchiveServiceCategory.bind(null, category.id)}>
                  <button
                    type="submit"
                    className="flex h-8 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
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
