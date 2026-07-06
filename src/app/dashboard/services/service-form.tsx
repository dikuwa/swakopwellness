"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { Select } from "@/ui/components";


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
  featuredImageId: string | null;
}

interface GalleryImage {
  id: string;
  publicUrl: string | null;
  altText: string | null;
}

interface Props {
  categories: Category[];
  action: (
    data: FormData,
  ) => Promise<{ ok: boolean; error?: string; serviceId?: string }>;
  initialData?: ServiceFormData;
  galleryImages?: GalleryImage[];
  children?: ReactNode;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ServiceForm({ categories, action, initialData, galleryImages, children }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;
  const slugManuallyEdited = useRef(false);

  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");

  const firstImage = (galleryImages && galleryImages.length > 0) ? galleryImages[0] : null;

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => action(formData),
    null as { ok: boolean; error?: string; serviceId?: string } | null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Service updated" : "Service created");
      if (isEdit) {
        router.push("/dashboard/services");
      } else if ("serviceId" in state && state.serviceId) {
        router.push(`/dashboard/services/${state.serviceId}/edit`);
      } else {
        router.push("/dashboard/services");
      }
    } else if (state?.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router, isEdit]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!slugManuallyEdited.current) {
      const slugInput = document.getElementById("slug") as HTMLInputElement;
      if (slugInput) {
        slugInput.value = generateSlug(e.target.value);
      }
    }
  };

  const handleSlugChange = () => {
    slugManuallyEdited.current = true;
  };

  return (
    <>
      <Link
        href="/dashboard/services"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back to Services
      </Link>

      <h1 className="text-3xl font-semibold tracking-[-0.035em]">
        {isEdit ? "Edit Service" : "New Service"}
      </h1>

      {state?.ok === false && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="mt-8 pb-24 relative">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
          {/* Main Column: Information */}
          <div className="space-y-6">
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
                    onChange={handleNameChange}
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
                    onChange={handleSlugChange}
                    placeholder="Auto-generated from name"
                    className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  <Select
                    id="categoryId"
                    name="categoryId"
                    value={categoryId}
                    onChange={setCategoryId}
                    options={[
                      { value: "", label: "No category" },
                      ...categories.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    placeholder="No category"
                  />
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
              <h2 className="text-lg font-semibold">Service Details</h2>

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
          </div>

          {/* Side Column: Image & Settings */}
          <div className="space-y-6 lg:sticky lg:top-4">
            <div className="space-y-4 rounded-xl border border-border bg-background p-6">
              <h2 className="text-lg font-semibold">Service Image</h2>
              <p className="text-xs text-muted-foreground">The first gallery image is used as the main service image.</p>

              {firstImage?.publicUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface">
                  <img
                    src={firstImage.publicUrl}
                    alt={firstImage.altText || "Service image"}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface">
                  <span className="text-xs text-muted-foreground">No images yet — upload via Gallery Images</span>
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-background p-6">
              <h2 className="text-lg font-semibold">Visibility & Settings</h2>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name="publicVisible"
                    defaultChecked={initialData?.publicVisible ?? true}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  Publicly visible
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name="bookingEnabled"
                    defaultChecked={initialData?.bookingEnabled ?? true}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  Booking enabled
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={initialData?.featured ?? false}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  Featured offering
                </label>
              </div>
            </div>

            {children}
          </div>
        </div>

        {/* Sticky Actions Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 backdrop-blur py-4 px-6 md:left-[240px] flex items-center justify-between">
          <div className="flex items-center gap-4 max-w-6xl mx-auto w-full">
            <button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-all shadow-sm hover:bg-primary/95 hover:shadow disabled:opacity-50"
            >
              {isPending ? "Saving..." : isEdit ? "Update Service" : "Create Service"}
            </button>
            <Link
              href="/dashboard/services"
              className="flex h-11 items-center rounded-xl border border-border bg-background px-5 text-sm font-semibold transition-colors hover:bg-surface-muted"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}
