"use client";

import { useActionState, useState } from "react";
import { addServiceGalleryImage, removeServiceGalleryImage } from "@/services/actions";

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
  const unusedMedia = allMedia.filter((m) => !images.some((i) => i.id === m.id));

  const [, addAction, addPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const assetId = formData.get("assetId") as string;
      if (!assetId) return null;
      await addServiceGalleryImage(serviceId, assetId);
      const asset = allMedia.find((m) => m.id === assetId);
      if (asset) setImages((prev) => [...prev, asset]);
      return { ok: true };
    },
    null,
  );

  return (
    <section className="mt-8 rounded-xl border border-border bg-background p-6">
      <h2 className="text-lg font-semibold">Gallery Images</h2>
      <p className="mt-2 text-sm text-muted-foreground">Additional images displayed on the service detail page.</p>

      <form action={addAction} className="mt-5 flex gap-3">
        <select
          name="assetId"
          required
          className="h-11 flex-1 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary"
        >
          <option value="">Select an image\u2026</option>
          {unusedMedia.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.altText || asset.id.slice(0, 8)}
            </option>
          ))}
        </select>
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
          {images.map((asset) => (
            <div key={asset.id} className="group relative overflow-hidden rounded-2xl border border-border">
              <div className="aspect-square overflow-hidden bg-surface">
                {asset.publicUrl ? (
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
              <div className="p-2">
                <form
                  action={async () => {
                    await removeServiceGalleryImage(serviceId, asset.id);
                    setImages((prev) => prev.filter((i) => i.id !== asset.id));
                  }}
                >
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-destructive/30 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
