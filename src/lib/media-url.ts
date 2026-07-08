type MediaAssetRef = {
  id: string | null;
  publicUrl?: string | null;
};

export function getMediaUrl(asset: MediaAssetRef | null | undefined) {
  if (!asset) return "";
  if (asset.id) return `/api/media/${asset.id}`;
  return asset.publicUrl ?? "";
}
