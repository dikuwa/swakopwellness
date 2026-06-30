"use client";

import { useActionState } from "react";
import { deleteMediaAction } from "@/media/actions";

type MediaAsset = {
  id: string;
  storageKey: string;
  publicUrl: string | null;
  altText: string | null;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function DeleteButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(
    async () => {
      return deleteMediaAction(id);
    },
    null,
  );

  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-semibold text-destructive transition-colors hover:text-destructive/80 disabled:opacity-50"
      >
        {pending ? "\u2026" : "Delete"}
      </button>
      {state && "error" in state ? (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

export function MediaGrid({ assets }: { assets: MediaAsset[] }) {
  if (assets.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No images uploaded yet.
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => (
        <div key={asset.id} className="group relative overflow-hidden rounded-2xl border border-border bg-surface-muted">
          <div className="aspect-square overflow-hidden bg-surface">
            {asset.publicUrl ? (
              <img
                src={asset.publicUrl}
                alt={asset.altText ?? ""}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No URL</div>
            )}
          </div>
          <div className="space-y-1 p-3">
            <p className="truncate text-xs text-muted-foreground">
              {asset.altText || "No alt text"}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {formatBytes(asset.byteSize)}
              {asset.width && asset.height ? ` \u00B7 ${asset.width}\u00D7${asset.height}` : ""}
            </p>
            <DeleteButton id={asset.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
