"use server";

import { count, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { mediaAssets, serviceImages } from "@/db/schema";
import { r2Configured, uploadFile, deleteFile } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_SIZE = 8 * 1024 * 1024;

export async function getMediaAssets() {
  await requirePermission("settings:manage");
  const db = getDb();
  return db
    .select({
      id: mediaAssets.id,
      storageKey: mediaAssets.storageKey,
      publicUrl: mediaAssets.publicUrl,
      altText: mediaAssets.altText,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      width: mediaAssets.width,
      height: mediaAssets.height,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt));
}

export async function uploadMediaAction(formData: FormData) {
  await requirePermission("settings:manage");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided." };

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: `Unsupported file type: ${file.type}.` };
  }
  if (file.size > MAX_SIZE) {
    return { error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.` };
  }
  if (!r2Configured()) {
    return { error: "Object storage is not configured." };
  }

  const ext = file.name.split(".").pop() || "bin";
  const key = `media/${crypto.randomUUID()}.${ext}`;
  const altText = formData.get("altText") as string | null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const publicUrl = await uploadFile(key, new Uint8Array(buffer), file.type);

  const db = getDb();
  const [asset] = await db
    .insert(mediaAssets)
    .values({
      storageKey: key,
      publicUrl,
      altText: altText || null,
      mimeType: file.type,
      byteSize: file.size,
    })
    .returning();

  revalidatePath("/dashboard/media");
  return { asset };
}

export async function updateMediaAltAction(id: string, altText: string) {
  await requirePermission("settings:manage");
  const db = getDb();
  await db.update(mediaAssets).set({ altText: altText || null }).where(eq(mediaAssets.id, id));
  revalidatePath("/dashboard/media");
}

export async function deleteMediaAction(id: string) {
  await requirePermission("settings:manage");
  const db = getDb();

  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!asset) return { error: "Asset not found." };

  const [used] = await db
    .select({ value: count() })
    .from(serviceImages)
    .where(eq(serviceImages.mediaAssetId, id));

  if (used.value > 0) {
    return { error: `Cannot delete. Used by ${used.value} service(s). Remove the association first.` };
  }

  try {
    await deleteFile(asset.storageKey);
  } catch {
  }

  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  revalidatePath("/dashboard/media");
}
