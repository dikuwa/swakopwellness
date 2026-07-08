"use server";

import { count, desc, eq, and, asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { mediaAssets, serviceImages, services } from "@/db/schema";
import { getMediaUrl } from "@/lib/media-url";
import { uploadFile, deleteFile } from "@/lib/storage";
import sizeOf from "image-size";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_SIZE = 8 * 1024 * 1024;

async function detectImageDimensions(buffer: Uint8Array): Promise<{ width: number | null; height: number | null }> {
  try {
    const dimensions = sizeOf(Buffer.from(buffer));
    return { width: dimensions.width ?? null, height: dimensions.height ?? null };
  } catch {
    return { width: null, height: null };
  }
}

export type MediaWithUsage = {
  id: string;
  storageKey: string;
  publicUrl: string | null;
  altText: string | null;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
  usedAsFeatured: { serviceId: string; serviceName: string } | null;
  usedAsGallery: { serviceId: string; serviceName: string }[];
};

export async function getMediaAssets() {
  await requirePermission("settings:manage");
  const db = getDb();
  const assets = await db
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

  return assets.map((asset) => ({ ...asset, publicUrl: getMediaUrl(asset) }));
}

export async function getMediaWithUsage(): Promise<MediaWithUsage[]> {
  await requirePermission("settings:manage");
  const db = getDb();

  const assets = await db
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

  if (assets.length === 0) return [];

  const mediaIds = assets.map((a) => a.id);

  // Find which services use each media as featured image
  const featuredServices = await db
    .select({
      mediaAssetId: services.featuredImageId,
      serviceId: services.id,
      serviceName: services.name,
    })
    .from(services)
    .where(inArray(services.featuredImageId, mediaIds));

  // Find which services use each media in gallery
  const galleryServices = await db
    .select({
      mediaAssetId: serviceImages.mediaAssetId,
      serviceId: serviceImages.serviceId,
      serviceName: services.name,
    })
    .from(serviceImages)
    .innerJoin(services, eq(serviceImages.serviceId, services.id))
    .where(inArray(serviceImages.mediaAssetId, mediaIds));

  const featuredMap = new Map<string, { serviceId: string; serviceName: string }>();
  for (const fs of featuredServices) {
    if (fs.mediaAssetId) featuredMap.set(fs.mediaAssetId, { serviceId: fs.serviceId, serviceName: fs.serviceName });
  }

  const galleryMap = new Map<string, { serviceId: string; serviceName: string }[]>();
  for (const gs of galleryServices) {
    const list = galleryMap.get(gs.mediaAssetId) ?? [];
    list.push({ serviceId: gs.serviceId, serviceName: gs.serviceName });
    galleryMap.set(gs.mediaAssetId, list);
  }

  return assets.map((a) => ({
    ...a,
    publicUrl: getMediaUrl(a),
    usedAsFeatured: featuredMap.get(a.id) ?? null,
    usedAsGallery: galleryMap.get(a.id) ?? [],
  }));
}

export type ServiceOption = { id: string; name: string };

export async function getServicesList(): Promise<ServiceOption[]> {
  await requirePermission("services:manage");
  const db = getDb();
  return db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder));
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

  const ext = file.name.split(".").pop() || "bin";
  const key = `media/${crypto.randomUUID()}.${ext}`;
  const altText = formData.get("altText") as string | null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const u8 = new Uint8Array(buffer);
  const publicUrl = await uploadFile(key, u8, file.type);
  const { width, height } = await detectImageDimensions(u8);

  const db = getDb();
  const [asset] = await db
    .insert(mediaAssets)
    .values({
      storageKey: key,
      publicUrl,
      altText: altText || null,
      mimeType: file.type,
      byteSize: file.size,
      width,
      height,
    })
    .returning();

  revalidatePath("/dashboard/media");
  return { asset: { ...asset, publicUrl: getMediaUrl(asset) } };
}

export async function uploadMultipleMediaAction(formData: FormData) {
  await requirePermission("settings:manage");

  const files = formData.getAll("files") as File[];
  if (files.length === 0) return { error: "No files provided." };

  const results: { name: string; success: boolean; error?: string }[] = [];
  const db = getDb();

  for (const file of files) {
    if (!file || file.size === 0) {
      results.push({ name: file?.name ?? "unknown", success: false, error: "Empty file." });
      continue;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      results.push({ name: file.name, success: false, error: `Unsupported type: ${file.type}` });
      continue;
    }
    if (file.size > MAX_SIZE) {
      results.push({ name: file.name, success: false, error: `File too large (max ${MAX_SIZE / 1024 / 1024}MB).` });
      continue;
    }

    try {
      const ext = file.name.split(".").pop() || "bin";
      const key = `media/${crypto.randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const u8 = new Uint8Array(buffer);
      const publicUrl = await uploadFile(key, u8, file.type);
      const { width, height } = await detectImageDimensions(u8);

      await db.insert(mediaAssets).values({
        storageKey: key,
        publicUrl,
        mimeType: file.type,
        byteSize: file.size,
        width,
        height,
      });

      results.push({ name: file.name, success: true });
    } catch {
      results.push({ name: file.name, success: false, error: "Upload failed." });
    }
  }

  revalidatePath("/dashboard/media");
  return { results };
}

export async function updateMediaAltAction(id: string, altText: string) {
  await requirePermission("settings:manage");
  const db = getDb();
  await db.update(mediaAssets).set({ altText: altText || null }).where(eq(mediaAssets.id, id));
  revalidatePath("/dashboard/media");
}

export async function assignMediaToServiceAction(
  mediaAssetId: string,
  serviceId: string,
  role: "featured" | "gallery",
) {
  await requirePermission("services:manage");
  const db = getDb();

  const [service] = await db.select({ id: services.id }).from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service) return { error: "Service not found." };

  const [asset] = await db.select({ id: mediaAssets.id }).from(mediaAssets).where(eq(mediaAssets.id, mediaAssetId)).limit(1);
  if (!asset) return { error: "Media asset not found." };

  try {
    if (role === "featured") {
      await db.update(services).set({ featuredImageId: mediaAssetId, updatedAt: new Date() }).where(eq(services.id, serviceId));
    } else {
      // Gallery - check if already assigned
      const [existing] = await db
        .select({ mediaAssetId: serviceImages.mediaAssetId })
        .from(serviceImages)
        .where(and(eq(serviceImages.serviceId, serviceId), eq(serviceImages.mediaAssetId, mediaAssetId)))
        .limit(1);

      if (!existing) {
        const [last] = await db
          .select({ sortOrder: serviceImages.sortOrder })
          .from(serviceImages)
          .where(eq(serviceImages.serviceId, serviceId))
          .orderBy(desc(serviceImages.sortOrder))
          .limit(1);

        await db.insert(serviceImages).values({
          serviceId,
          mediaAssetId,
          sortOrder: last ? last.sortOrder + 1 : 0,
        });
      }
    }

    revalidatePath("/dashboard/media");
    revalidatePath("/dashboard/services");
    revalidatePath(`/dashboard/services/${serviceId}/edit`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assignment failed.";
    return { error: message };
  }
}

export async function replaceMediaFileAction(id: string, formData: FormData) {
  await requirePermission("settings:manage");
  const db = getDb();

  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!asset) return { error: "Asset not found." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided." };

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: `Unsupported file type: ${file.type}.` };
  }
  if (file.size > MAX_SIZE) {
    return { error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.` };
  }

  try {
    // Delete old file
    try {
      await deleteFile(asset.storageKey);
    } catch {
      // Old file may not exist
    }

    // Upload new file with same key pattern (new UUID)
    const ext = file.name.split(".").pop() || "bin";
    const key = `media/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const u8 = new Uint8Array(buffer);
    const publicUrl = await uploadFile(key, u8, file.type);
    const { width, height } = await detectImageDimensions(u8);

    // Update the asset in place (preserving existing assignments)
    await db
      .update(mediaAssets)
      .set({
        storageKey: key,
        publicUrl,
        mimeType: file.type,
        byteSize: file.size,
        width,
        height,
      })
      .where(eq(mediaAssets.id, id));

    revalidatePath("/dashboard/media");
    return { success: true, publicUrl: getMediaUrl({ id, publicUrl }) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Replace failed.";
    return { error: message };
  }
}

export async function uploadMediaAndReturnAction(formData: FormData) {
  await requirePermission("settings:manage");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided." };

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: `Unsupported file type: ${file.type}.` };
  }
  if (file.size > MAX_SIZE) {
    return { error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.` };
  }

  try {
    const ext = file.name.split(".").pop() || "bin";
    const key = `media/${crypto.randomUUID()}.${ext}`;
    const altText = formData.get("altText") as string | null;
    const buffer = Buffer.from(await file.arrayBuffer());
    const u8 = new Uint8Array(buffer);
    const publicUrl = await uploadFile(key, u8, file.type);
    const { width, height } = await detectImageDimensions(u8);

    const db = getDb();
    const [asset] = await db
      .insert(mediaAssets)
      .values({
        storageKey: key,
        publicUrl,
        altText: altText || null,
        mimeType: file.type,
        byteSize: file.size,
        width,
        height,
      })
      .returning({
        id: mediaAssets.id,
        storageKey: mediaAssets.storageKey,
        publicUrl: mediaAssets.publicUrl,
        altText: mediaAssets.altText,
        mimeType: mediaAssets.mimeType,
        byteSize: mediaAssets.byteSize,
        width: mediaAssets.width,
        height: mediaAssets.height,
        createdAt: mediaAssets.createdAt,
      });

    revalidatePath("/dashboard/media");
    return { asset: { ...asset, publicUrl: getMediaUrl(asset) } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return { error: message };
  }
}

export async function removeMediaAssignmentAction(
  mediaAssetId: string,
  serviceId: string,
  role: "featured" | "gallery",
) {
  await requirePermission("services:manage");
  const db = getDb();

  try {
    if (role === "featured") {
      await db
        .update(services)
        .set({ featuredImageId: null, updatedAt: new Date() })
        .where(eq(services.id, serviceId));
    } else {
      await db
        .delete(serviceImages)
        .where(and(eq(serviceImages.serviceId, serviceId), eq(serviceImages.mediaAssetId, mediaAssetId)));
    }

    revalidatePath("/dashboard/media");
    revalidatePath("/dashboard/services");
    revalidatePath(`/dashboard/services/${serviceId}/edit`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Removal failed.";
    return { error: message };
  }
}

export async function deleteMediaAction(id: string) {
  await requirePermission("settings:manage");
  const db = getDb();

  const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!asset) return { error: "Asset not found." };

  const [usedAsGallery] = await db
    .select({ value: count() })
    .from(serviceImages)
    .where(eq(serviceImages.mediaAssetId, id));

  const [usedAsFeatured] = await db
    .select({ value: count() })
    .from(services)
    .where(eq(services.featuredImageId, id));

  const totalUsage = (usedAsGallery?.value ?? 0) + (usedAsFeatured?.value ?? 0);

  if (totalUsage > 0) {
    return { error: `Cannot delete. Used by ${totalUsage} service(s) as featured image or gallery. Remove the association first from the detail view or the service edit page.` };
  }

  try {
    await deleteFile(asset.storageKey);
  } catch {
  }

  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  revalidatePath("/dashboard/media");
}
