"use client";

import { useActionState, useRef, useState } from "react";
import { Select } from "@/ui/components";
import { addServiceGalleryImage, removeServiceGalleryImage, reorderServiceGalleryImage } from "@/services/actions";
import { uploadMediaAndReturnAction } from "@/media/actions";
import { ArrowUp, ArrowDown, Trash2, Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

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
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const multiUploadRef = useRef<HTMLInputElement>(null);
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

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    let uploaded = 0;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", file.name.split(".")[0] ?? "");

      try {
        const result = await uploadMediaAndReturnAction(formData);
        if (result?.error) {
          toast.error(`${file.name}: ${result.error}`);
        } else if (result?.asset) {
          await addServiceGalleryImage(serviceId, result.asset.id);
          setImages((prev) => [...prev, result.asset]);
          uploaded++;
        }
      } catch {
        toast.error(`Upload failed: ${file.name}`);
      }
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} image${uploaded > 1 ? "s" : ""} added to gallery`);
    }
    setUploadingFiles(false);
    if (multiUploadRef.current) multiUploadRef.current.value = "";
  };

  const moveImage = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const currentAsset = images[index];
    const swapAsset = images[newIndex];

    const updated = [...images];
    updated[index] = swapAsset;
    updated[newIndex] = currentAsset;
    setImages(updated);

    await reorderServiceGalleryImage(serviceId, currentAsset.id, newIndex);
    await reorderServiceGalleryImage(serviceId, swapAsset.id, index);
  };

  const removeImage = async (assetId: string) => {
    await removeServiceGalleryImage(serviceId, assetId);
    setImages((prev) => prev.filter((i) => i.id !== assetId));
    toast.success("Image removed from gallery");
  };

  return (
    <section className="mt-8 rounded-xl border border-border bg-background p-6">
      <h2 className="text-lg font-semibold">Gallery Images</h2>
      <p className="mt-2 text-sm text-muted-foreground">Additional images displayed on the service detail page.</p>

      {/* Multi-file upload area */}
      <div className="mt-5">
        <div
          onClick={() => !uploadingFiles && multiUploadRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted/50 p-6 transition-colors hover:border-primary/50 ${
            uploadingFiles ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {uploadingFiles ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="mt-2 text-sm font-medium text-muted-foreground">Uploading images...</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="mt-2 text-sm font-semibold">Upload images</span>
              <span className="mt-1 text-xs text-muted-foreground">Click to select multiple files (JPG, PNG, WebP)</span>
            </>
          )}
        </div>
        <input
          ref={multiUploadRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          onChange={handleMultiUpload}
          className="sr-only"
        />
      </div>

      {/* Existing: add from library */}
      <form action={addAction} className="mt-4 flex gap-3">
        <div className="flex-1">
          <Select
            name="assetId"
            options={[
              { value: "", label: "Or pick from existing media..." },
              ...unusedMedia.map((asset) => ({
                value: asset.id,
                label: asset.altText || asset.id.slice(0, 8),
              })),
            ]}
            placeholder="Or pick from existing media..."
          />
        </div>
        <button
          type="submit"
          disabled={addPending}
          className="h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {addPending ? "Adding..." : "Add"}
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
