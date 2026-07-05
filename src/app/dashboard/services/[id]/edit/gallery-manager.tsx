"use client";

import { useActionState, useState } from "react";
import { Select } from "@/ui/components";
import { addServiceGalleryImage, removeServiceGalleryImage, reorderServiceGalleryImage } from "@/services/actions";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";

interface MediaAsset {
  id: string;
  publicUrl: string | null;
  altText: string | null;
  mimeType: string;
  byteSize: number;
}

export function GalleryManager({
  serviceId,
  galleryImages,
  allMedia,
}: {
  serviceId: string;
  galleryImages: (MediaAsset | undefined)[];
  allMedia: MediaAsset[];
}) {
  const [images, setImages] = useState(galleryImages.filter(Boolean) as MediaAsset[]);
  const mediaMap = new Map(allMedia.map((m) => [m.id, m]));
  const imageIds = new Set(images.map((i) => i.id));
  const unusedMedia = allMedia.filter((m) => !imageIds.has(m.id));

  const [, addAction, addPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const assetId = formData.get("assetId") as string;
      if (!assetId) return null;
      await addServiceGalleryImage(serviceId, assetId);
      const asset = mediaMap.get(assetId);
      if (asset) setImages((prev) => [...prev, asset]);
      return { ok: true };
    },
    null,
  );

  const moveImage = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const currentAsset = images[index];
    const swapAsset = images[newIndex];

    // Update local state immediately
    const updated = [...images];
    updated[index] = swapAsset;
    updated[newIndex] = currentAsset;
    setImages(updated);

    // Persist to DB
    await reorderServiceGalleryImage(serviceId, currentAsset.id, newIndex);
    await reorderServiceGalleryImage(serviceId, swapAsset.id, index);
  };

  const removeImage = async (assetId: string) => {
    await removeServiceGalleryImage(serviceId, assetId);
    setImages((prev) => prev.filter((i) => i.id !== assetId));
  };

  return (
    <section className="mt-8 rounded-xl border border-border bg-background p-6">
      <h2 className="text-lg font-semibold">Gallery Images</h2>
      <p className="mt-2 text-sm text-muted-foreground">Additional images displayed on the service detail page.</p>

      <form action={addAction} className="mt-5 flex gap-3">
        <div className="flex-1">
          <Select
            name="assetId"
            required
            options={[
              { value: "", label: "Select an image…" },
              ...unusedMedia.map((asset) => ({
                value: asset.id,
                label: asset.altText || asset.id.slice(0, 8),
              })),
            ]}
            placeholder="Select an image…"
          />
        </div>
        <button
          type="submit"
          disabled={addPending}
          className="h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Add to Gallery
        </button>
      </form>

      {images.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-surface-muted p-4 text-sm text-muted-foreground">No gallery images yet.</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((asset, index) => (
            <div key={asset.id} className="group relative overflow-hidden rounded-2xl border border-border">
              <div className="aspect-square overflow-hidden bg-surface">
                {asset.publicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- media URLs are administrator-managed R2/public URLs.
                  <img
                    src={asset.publicUrl}
                    alt={asset.altText ?? ""}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No URL</div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-border p-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, "up")}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, "down")}
                    disabled={index === images.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="ml-1 text-[10px] text-muted-foreground">{index + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(asset.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
