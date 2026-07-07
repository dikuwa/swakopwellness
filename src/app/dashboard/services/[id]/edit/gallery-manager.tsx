"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Select } from "@/ui/components";
import { addServiceGalleryImage, removeServiceGalleryImage, reorderServiceGalleryImage } from "@/services/actions";
import { uploadMediaAndReturnAction } from "@/media/actions";
import { ArrowUp, ArrowDown, Trash2, Upload, Loader2, GripVertical } from "lucide-react";
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
  onFeaturedImageChange,
}: {
  serviceId: string;
  galleryImages: (MediaAsset | undefined)[];
  allMedia: MediaAsset[];
  /** Called when the first image changes (reorder / add / remove) */
  onFeaturedImageChange?: (publicUrl: string | null) => void;
}) {
  const [images, setImages] = useState(galleryImages.filter(Boolean) as MediaAsset[]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const multiUploadRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const mediaMap = new Map(allMedia.map((m) => [m.id, m]));
  const imageIds = new Set(images.map((i) => i.id));
  const unusedMedia = allMedia.filter((m) => !imageIds.has(m.id));

  // Refs to avoid stale closures in drag event handlers (called synchronously by the browser)
  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [images]);
  const draggedIndexRef = useRef(draggedIndex);
  useEffect(() => { draggedIndexRef.current = draggedIndex; }, [draggedIndex]);

  const [, addAction, addPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const assetId = formData.get("assetId") as string;
      if (!assetId) return null;
      await addServiceGalleryImage(serviceId, assetId);
      const asset = mediaMap.get(assetId);
      if (asset) {
        const updated = [...images, asset];
        setImages(updated);
        // If this was the first image, notify parent
        if (images.length === 0 && onFeaturedImageChange) {
          onFeaturedImageChange(asset.publicUrl);
        }
      }
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
          setImages((prev) => {
            const updated = [...prev, result.asset];
            // If first image added, notify parent
            if (prev.length === 0 && onFeaturedImageChange) {
              onFeaturedImageChange(result.asset.publicUrl);
            }
            return updated;
          });
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

    // Optimistic update
    const updated = [...images];
    updated[index] = swapAsset;
    updated[newIndex] = currentAsset;
    setImages(updated);

    // Notify parent of new first image
    if (newIndex === 0 || index === 0) {
      const firstImage = newIndex === 0 ? currentAsset : swapAsset;
      onFeaturedImageChange?.(firstImage.publicUrl);
    }

    setReorderingId(currentAsset.id);
    await reorderServiceGalleryImage(serviceId, currentAsset.id, newIndex);
    await reorderServiceGalleryImage(serviceId, swapAsset.id, index);
    setReorderingId(null);
  };

  // --- Drag-and-drop handlers ---
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const currentDragged = draggedIndexRef.current;
    if (currentDragged === null || currentDragged === index) return;

    const currentImages = [...imagesRef.current];
    const dragged = currentImages[currentDragged];
    currentImages.splice(currentDragged, 1);
    currentImages.splice(index, 0, dragged);
    setImages(currentImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = useCallback(async () => {
    const currentDragged = draggedIndexRef.current;
    if (currentDragged === null) return;
    setDraggedIndex(null);

    const currentImages = imagesRef.current;

    // Persist the new order to the server
    setReorderingId("all");
    for (let i = 0; i < currentImages.length; i++) {
      await reorderServiceGalleryImage(serviceId, currentImages[i].id, i);
    }
    setReorderingId(null);

    // Notify parent of new featured image
    if (currentImages.length > 0) {
      onFeaturedImageChange?.(currentImages[0].publicUrl);
    }
  }, [serviceId, onFeaturedImageChange]);

  const removeImage = async (assetId: string) => {
    await removeServiceGalleryImage(serviceId, assetId);
    const updated = images.filter((i) => i.id !== assetId);
    setImages(updated);

    // If first image was removed, notify parent with new first image (or null)
    if (images[0]?.id === assetId || images.length === 0) {
      onFeaturedImageChange?.(updated[0]?.publicUrl ?? null);
    }

    toast.success("Image removed from gallery");
  };

  const isReorderingAll = reorderingId === "all";

  return (
    <section className="mt-8 rounded-xl border border-border bg-background p-6 relative">
      {/* Loading overlay during drag-end persistence */}
      {isReorderingAll && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Saving order...</span>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold">Gallery Images</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Drag images to reorder. The first image is the main service image and updates the preview automatically.
      </p>

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

      {/* Add from library */}
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
            <div
              key={asset.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
                index === 0
                  ? "border-primary/40 ring-1 ring-primary/20"
                  : "border-border"
              } ${
                draggedIndex === index ? "opacity-50 scale-95" : ""
              } cursor-grab active:cursor-grabbing`}
            >
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-lg bg-black/50 px-2 py-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-[10px] font-medium">Drag</span>
              </div>

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

              {index === 0 && (
                <div className="flex items-center justify-center bg-primary/10 px-2 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Main Image</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border p-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, "up")}
                    disabled={index === 0 || reorderingId !== null}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, "down")}
                    disabled={index === images.length - 1 || reorderingId !== null}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  {reorderingId === "all" || reorderingId === asset.id ? (
                    <Loader2 className="ml-1 h-3 w-3 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="ml-1 text-[10px] text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(asset.id)}
                  disabled={reorderingId !== null}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
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
