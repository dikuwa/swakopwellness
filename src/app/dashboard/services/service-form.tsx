"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { Loader2, Upload } from "lucide-react";
import { Select } from "@/ui/components";
import { uploadMediaAndReturnAction } from "@/media/actions";


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

interface MediaAsset {
  id: string;
  publicUrl: string | null;
  altText: string | null;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
}



interface Props {
  categories: Category[];
  action: (
    data: FormData,
  ) => Promise<{ ok: boolean; error?: string; serviceId?: string }>;
  initialData?: ServiceFormData;
  mediaAssets?: MediaAsset[];
  children?: ReactNode;
}

export function ServiceForm({ categories, action, initialData, mediaAssets, children }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [localMediaAssets, setLocalMediaAssets] = useState<MediaAsset[]>(mediaAssets ?? []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local state with prop on change
    if (mediaAssets) setLocalMediaAssets(mediaAssets);
  }, [mediaAssets]);

  const handleInlineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInline(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", file.name.split(".")[0] ?? "");

    try {
      const result = await uploadMediaAndReturnAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.asset) {
        setLocalMediaAssets((prev) => [result.asset, ...prev]);
        toast.success("Image uploaded");
        // Auto-select the uploaded image
        setTimeout(() => {
          (document.getElementById("featuredImageId") as HTMLInputElement).value = result.asset.id;
          document.querySelectorAll("[data-img-picker]").forEach((el) => el.classList.remove("ring-2", "ring-primary"));
          document.querySelector(`[data-img-picker][data-id="${result.asset.id}"]`)?.classList.add("ring-2", "ring-primary");
        }, 50);
      }
    } catch {
      toast.error("Upload failed");
    }
    setUploadingInline(false);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => action(formData),
    null as { ok: boolean; error?: string; serviceId?: string } | null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Service updated" : "Service created");
      router.push("/dashboard/services");
    } else if (state?.ok === false && state.error) {
      toast.error(state.error);
    }
  }, [state, router, isEdit]);

  return (
    <>
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
                <Select
                  id="categoryId"
                  name="categoryId"
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

          <div className="space-y-6 rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Featured Image</h2>
            <input type="hidden" name="featuredImageId" value={initialData?.featuredImageId ?? ""} id="featuredImageId" />

            {/* Inline upload */}
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              onChange={handleInlineUpload}
              className="sr-only"
              id="inline-upload-input"
            />
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={uploadingInline}
              className="mb-4 flex h-9 items-center gap-2 rounded-xl border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              {uploadingInline ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Upload new image
                </>
              )}
            </button>

            {localMediaAssets.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                <button
                  type="button"
                  onClick={() => {
                    (document.getElementById("featuredImageId") as HTMLInputElement).value = "";
                    document.querySelectorAll("[data-img-picker]").forEach((el) => el.classList.remove("ring-2", "ring-primary"));
                  }}
                  className={`aspect-square overflow-hidden rounded-xl border-2 ${!initialData?.featuredImageId ? "border-primary" : "border-border"} bg-surface-muted transition-colors hover:border-primary`}
                >
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">None</div>
                </button>
                {localMediaAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    data-img-picker
                    data-id={asset.id}
                    onClick={() => {
                      (document.getElementById("featuredImageId") as HTMLInputElement).value = asset.id;
                      document.querySelectorAll("[data-img-picker]").forEach((el) => el.classList.remove("ring-2", "ring-primary"));
                      document.querySelector(`[data-img-picker][data-id="${asset.id}"]`)?.classList.add("ring-2", "ring-primary");
                    }}
                    className={`aspect-square overflow-hidden rounded-xl border-2 ${initialData?.featuredImageId === asset.id ? "border-primary ring-2 ring-primary" : "border-border"} bg-surface transition-colors hover:border-primary`}
                  >
                    {asset.publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- media URLs are administrator-managed R2/public URLs.
                      <img src={asset.publicUrl} alt={asset.altText ?? ""} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No URL</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No media assets available.{" "}
                <a href="/dashboard/media" className="text-primary underline">Upload images</a> first.
              </p>
            )}
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
    </>
  );
}
