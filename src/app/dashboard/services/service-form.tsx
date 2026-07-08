"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import toast from "react-hot-toast";
import { Select } from "@/ui/components";
import { Upload, Loader2 } from "lucide-react";
import { uploadServiceFeaturedImage, removeServiceFeaturedImage } from "@/services/actions";


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
  serviceId?: string;
  children?: ReactNode;
  /** Called when the gallery reorders and the featured image changes */
  onFeaturedImageChange?: (publicUrl: string | null) => void;
}

type ServiceActionState = {
  ok: boolean;
  error?: string;
  serviceId?: string;
  values?: Record<string, string>;
  nonce?: number;
} | null;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ServiceForm({ categories, action, initialData, serviceId, galleryImages, children, onFeaturedImageChange }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;
  const slugManuallyEdited = useRef(false);

  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");

  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(
    () => (galleryImages && galleryImages.length > 0) ? (galleryImages[0]?.publicUrl ?? null) : null
  );

  const [, startTransition] = useTransition();

  // Sync featured image URL when the parent updates gallery images (e.g. reorder/remove from GalleryManager)
  useEffect(() => {
    const url = (galleryImages && galleryImages.length > 0) ? galleryImages[0].publicUrl : null;
    startTransition(() => {
      setFeaturedImageUrl(url);
    });
  }, [galleryImages, startTransition]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData): Promise<ServiceActionState> => {
      const values = Object.fromEntries(
        Array.from(formData.entries())
          .filter(([, value]) => typeof value === "string")
          .map(([key, value]) => [key, String(value)]),
      );
      const result = await action(formData);
      return result.ok ? result : { ...result, values, nonce: Date.now() };
    },
    null as ServiceActionState,
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
      }      } else if (state && 'ok' in state && state.ok === false && 'error' in state && state.error) {
        toast.error(state.error as string);
      }
  }, [state, router, isEdit]);

  const valueFor = (name: string, fallback: string | number | null | undefined = "") => {
    if (state?.ok === false && state.values && name in state.values) return state.values[name];
    return fallback ?? "";
  };

  const checkedFor = (name: string, fallback: boolean) => {
    if (state?.ok === false && state.values) return state.values[name] === "on";
    return fallback;
  };

  const effectiveServiceId = serviceId;

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      if (isEdit && effectiveServiceId) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadServiceFeaturedImage(effectiveServiceId, formData);
        if (result.ok && 'publicUrl' in result && result.publicUrl) {
          setFeaturedImageUrl(result.publicUrl);
          onFeaturedImageChange?.(result.publicUrl);
          toast.success("Image uploaded");
        } else {
          toast.error((result as { error?: string }).error ?? "Upload failed");
        }
      } else {
        // For new services, just show preview - upload happens during create
        const url = URL.createObjectURL(file);
        setFeaturedImageUrl(url);
        onFeaturedImageChange?.(url);
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (isEdit && effectiveServiceId) {
      const result = await removeServiceFeaturedImage(effectiveServiceId);
      if (result.ok) {
        setFeaturedImageUrl(null);
        onFeaturedImageChange?.(null);
        toast.success("Image removed");
      } else {
        toast.error((result as { error?: string }).error ?? "Failed to remove image");
      }
    } else {
      setFeaturedImageUrl(null);
      onFeaturedImageChange?.(null);
    }
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

      <form key={state?.ok === false ? state.nonce : "service-form"} action={formAction} className="mt-8 pb-24 relative">
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
                    defaultValue={valueFor("name", initialData?.name)}
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
                    defaultValue={valueFor("slug", initialData?.slug)}
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
                        state?.ok === false
                          ? valueFor("price")
                          : initialData
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
                    defaultValue={valueFor("duration", initialData?.durationMinutes)}
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
                    defaultValue={valueFor("sortOrder", initialData?.sortOrder ?? 0)}
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
                  defaultValue={valueFor("shortDescription", initialData?.shortDescription)}
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
                  defaultValue={valueFor("fullDescription", initialData?.fullDescription)}
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
                  defaultValue={valueFor("benefits", (initialData?.benefits ?? []).join(", "))}
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
                  defaultValue={valueFor("whatToExpect", initialData?.whatToExpect)}
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
                  defaultValue={valueFor("preparation", initialData?.preparation)}
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
                  defaultValue={valueFor("safetyInformation", initialData?.safetyInformation)}
                  className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Side Column: Image & Settings */}
          <div className="space-y-6 lg:sticky lg:top-4">
            <div className="space-y-4 rounded-xl border border-border bg-background p-6">
              <h2 className="text-lg font-semibold">Service Image</h2>
              <p className="text-xs text-muted-foreground">Upload one main image for this service.</p>

              {featuredImageUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface group">
                  <img
                    src={featuredImageUrl}
                    alt="Service image"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-gray-100"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted/50 p-6 transition-colors hover:border-primary/50 ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="mt-2 text-sm font-medium text-muted-foreground">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="mt-2 text-sm font-semibold">Upload image</span>
                      <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP (max 8MB)</span>
                    </>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                onChange={handleImageUpload}
                className="sr-only"
              />
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-background p-6">
              <h2 className="text-lg font-semibold">Visibility & Settings</h2>
              <p className="text-xs text-muted-foreground">Control how this service appears on the website.</p>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name="publicVisible"
                    defaultChecked={checkedFor("publicVisible", initialData?.publicVisible ?? true)}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  Publicly visible
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name="bookingEnabled"
                    defaultChecked={checkedFor("bookingEnabled", initialData?.bookingEnabled ?? true)}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  Booking enabled
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={checkedFor("featured", initialData?.featured ?? false)}
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
