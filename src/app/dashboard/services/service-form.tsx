"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, type ReactNode } from "react";
import { DashboardNav } from "@/dashboard/components";

interface Category {
  id: string;
  name: string;
}

interface ServiceFormData {
  name: string;
  slug: string;
  categoryId: string | null;
  shortDescription: string;
  fullDescription: string;
  priceCents: number;
  durationMinutes: number | null;
  benefits: string[];
  whatToExpect: string | null;
  preparation: string | null;
  safetyInformation: string | null;
  publicVisible: boolean;
  bookingEnabled: boolean;
  featured: boolean;
  sortOrder: number;
}

interface Props {
  categories: Category[];
  action: (
    data: FormData,
  ) => Promise<{ ok: boolean; error?: string; serviceId?: string }>;
  initialData?: ServiceFormData;
  children?: ReactNode;
}

export function ServiceForm({ categories, action, initialData, children }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => action(formData),
    null as { ok: boolean; error?: string; serviceId?: string } | null,
  );

  useEffect(() => {
    if (state?.ok) {
      router.push("/dashboard/services");
    }
  }, [state, router]);

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-4xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
        <DashboardNav />
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">
          {isEdit ? "Edit Service" : "New Service"}
        </h1>

        {state?.ok === false && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={formAction} className="mt-8 space-y-8">
          <div className="space-y-6 rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={initialData?.name ?? ""}
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label
                  htmlFor="slug"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  defaultValue={initialData?.slug ?? ""}
                  placeholder="Auto-generated from name"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="categoryId"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Category
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  defaultValue={initialData?.categoryId ?? ""}
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="price"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Price (N$) *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                    N$
                  </span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="1"
                    min="0"
                    required
                    defaultValue={
                      initialData
                        ? (initialData.priceCents / 100).toFixed(0)
                        : ""
                    }
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="duration"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Duration (minutes)
                </label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="0"
                  defaultValue={initialData?.durationMinutes ?? ""}
                  placeholder="e.g. 30"
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label
                  htmlFor="sortOrder"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Sort Order
                </label>
                <input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min="0"
                  defaultValue={initialData?.sortOrder ?? 0}
                  className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="shortDescription"
                className="mb-1.5 block text-sm font-semibold"
              >
                Short Description
              </label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                rows={2}
                defaultValue={initialData?.shortDescription ?? ""}
                className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label
                htmlFor="fullDescription"
                className="mb-1.5 block text-sm font-semibold"
              >
                Full Description
              </label>
              <textarea
                id="fullDescription"
                name="fullDescription"
                rows={5}
                defaultValue={initialData?.fullDescription ?? ""}
                className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-6 rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Details</h2>

            <div>
              <label
                htmlFor="benefits"
                className="mb-1.5 block text-sm font-semibold"
              >
                Benefits (comma-separated)
              </label>
              <textarea
                id="benefits"
                name="benefits"
                rows={3}
                defaultValue={(initialData?.benefits ?? []).join(", ")}
                placeholder="Relaxation, Stress relief, Improved energy"
                className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label
                htmlFor="whatToExpect"
                className="mb-1.5 block text-sm font-semibold"
              >
                What to Expect
              </label>
              <textarea
                id="whatToExpect"
                name="whatToExpect"
                rows={3}
                defaultValue={initialData?.whatToExpect ?? ""}
                className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label
                htmlFor="preparation"
                className="mb-1.5 block text-sm font-semibold"
              >
                Preparation
              </label>
              <textarea
                id="preparation"
                name="preparation"
                rows={3}
                defaultValue={initialData?.preparation ?? ""}
                className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label
                htmlFor="safetyInformation"
                className="mb-1.5 block text-sm font-semibold"
              >
                Safety Information
              </label>
              <textarea
                id="safetyInformation"
                name="safetyInformation"
                rows={3}
                defaultValue={initialData?.safetyInformation ?? ""}
                className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Visibility & Settings</h2>

            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="publicVisible"
                  defaultChecked={initialData?.publicVisible ?? true}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Publicly visible
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="bookingEnabled"
                  defaultChecked={initialData?.bookingEnabled ?? true}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Booking enabled
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={initialData?.featured ?? false}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Featured
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-border pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Update Service"
                  : "Create Service"}
            </button>
            <Link
              href="/dashboard/services"
              className="flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
            >
              Cancel
            </Link>
          </div>
        </form>
        {children}
      </section>
    </main>
  );
}
