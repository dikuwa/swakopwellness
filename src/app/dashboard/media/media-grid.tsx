"use client";

import { useState } from "react";
import { ImageIcon, Trash2, Loader2, Link2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteMediaAction } from "@/media/actions";
import type { MediaWithUsage, ServiceOption } from "@/media/actions";
import { MediaDetailModal } from "./media-detail-modal";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function UsageLabel({ asset }: { asset: MediaWithUsage }) {
  const featured = asset.usedAsFeatured;
  const galleryCount = asset.usedAsGallery.length;
  const total = (featured ? 1 : 0) + galleryCount;

  if (total === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60">
        Unassigned
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
      <Link2 className="h-2.5 w-2.5" aria-hidden="true" />
      {total} {total === 1 ? "assignment" : "assignments"}
    </span>
  );
}

function DeleteButton({ id, onDeleted }: { id: string; onDeleted?: () => void }) {
  const [pending, setPending] = useState(false);

  const handleDelete = async () => {
    setPending(true);
    try {
      const result = await deleteMediaAction(id);
      if (result?.error) {
        toast.error(result.error);
        setPending(false);
        return;
      }
      toast.success("Image deleted");
      onDeleted?.();
    } catch {
      toast.error("Failed to delete");
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="flex items-center gap-1 text-xs font-semibold text-destructive transition-colors hover:text-destructive/80 disabled:opacity-50"
      aria-label="Delete image"
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="h-3 w-3" aria-hidden="true" />
      )}
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}

export function MediaGrid({
  assets,
  services,
  onRefresh,
}: {
  assets: MediaWithUsage[];
  services: ServiceOption[];
  onRefresh?: () => void;
}) {
  const [selectedAsset, setSelectedAsset] = useState<MediaWithUsage | null>(null);

  if (assets.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
        <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">No images uploaded yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Drop images above or click to browse
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {assets.map((asset) => {
          const fileName = asset.storageKey.split("/").pop() ?? asset.storageKey;

          return (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface-muted transition-all duration-200 hover:shadow-md hover:shadow-black/5"
            >
              {/* Thumbnail */}
              <button
                type="button"
                onClick={() => setSelectedAsset(asset)}
                className="block w-full text-left"
                aria-label={`View details: ${asset.altText || fileName}`}
              >
                <div className="aspect-square overflow-hidden bg-surface">
                  {asset.publicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.publicUrl}
                      alt={asset.altText ?? ""}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground/40">
                      <ImageIcon className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </button>

              {/* Info */}
              <div className="space-y-1.5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <UsageLabel asset={asset} />
                </div>

                <p className="truncate text-xs font-medium text-foreground">
                  {asset.altText || fileName}
                </p>

                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(asset.byteSize)}
                  {asset.width && asset.height
                    ? ` · ${asset.width}×${asset.height}`
                    : ""}{" "}
                  ·{" "}
                  {asset.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                    className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ImageIcon className="h-3 w-3" aria-hidden="true" />
                    Details
                  </button>
                  <DeleteButton id={asset.id} onDeleted={onRefresh} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedAsset && (
        <MediaDetailModal
          asset={selectedAsset}
          services={services}
          onClose={() => setSelectedAsset(null)}
          onDeleted={onRefresh}
          onUpdated={onRefresh}
        />
      )}
    </>
  );
}
