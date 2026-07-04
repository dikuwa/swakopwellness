"use client";

import { useState } from "react";

interface MediaAsset {
  id: string;
  storageKey: string;
  publicUrl: string | null;
  altText: string | null;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
}

export function TechnologyImagePicker({
  mediaAssets,
  currentImageId,
}: {
  mediaAssets: MediaAsset[];
  currentImageId: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string>(currentImageId ?? "");

  return (
    <div className="border-t border-border pt-6 mt-6">
      <h2 className="text-lg font-semibold">Technology Image</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Shown in the Diacom Technology section on the homepage.
      </p>
      <input type="hidden" name="technologyImageId" value={selectedId} />

      {mediaAssets.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => setSelectedId("")}
            className={`aspect-square overflow-hidden rounded-xl border-2 ${
              !selectedId ? "border-primary" : "border-border"
            } bg-surface-muted transition-colors hover:border-primary`}
          >
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              None
            </div>
          </button>
          {mediaAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => setSelectedId(asset.id)}
              className={`aspect-square overflow-hidden rounded-xl border-2 ${
                selectedId === asset.id
                  ? "border-primary ring-2 ring-primary"
                  : "border-border"
              } bg-surface transition-colors hover:border-primary`}
            >
              {asset.publicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.publicUrl}
                  alt={asset.altText ?? ""}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No URL
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No media assets available.{" "}
          <a href="/dashboard/media" className="text-primary underline">
            Upload images
          </a>{" "}
          first.
        </p>
      )}
    </div>
  );
}
