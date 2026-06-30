"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { services } from "@/db/schema";
import { recordActivity } from "@/activity-log/record";

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function createService(data: FormData) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const name = (data.get("name") as string)?.trim();
  if (!name) return { ok: false as const, error: "Name is required." };

  const slug = (data.get("slug") as string)?.trim() || generateSlug(name);
  const categoryId = (data.get("categoryId") as string) || null;
  const shortDescription = (data.get("shortDescription") as string) || "";
  const fullDescription = (data.get("fullDescription") as string) || "";
  const priceInput = parseFloat(data.get("price") as string) || 0;
  const priceCents = Math.round(priceInput * 100);
  const durationMinutes = parseInt(data.get("duration") as string) || null;
  const benefitsRaw = (data.get("benefits") as string) || "";
  const benefits = benefitsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const whatToExpect = (data.get("whatToExpect") as string) || null;
  const preparation = (data.get("preparation") as string) || null;
  const safetyInformation = (data.get("safetyInformation") as string) || null;
  const publicVisible = data.get("publicVisible") === "on";
  const bookingEnabled = data.get("bookingEnabled") === "on";
  const featured = data.get("featured") === "on";
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;

  try {
    const [service] = await db
      .insert(services)
      .values({
        name,
        slug,
        categoryId,
        shortDescription,
        fullDescription,
        priceCents,
        durationMinutes,
        benefits,
        whatToExpect,
        preparation,
        safetyInformation,
        publicVisible,
        bookingEnabled,
        featured,
        sortOrder,
        active: true,
      })
      .returning({ id: services.id });

    await recordActivity(
      user.id,
      "create",
      "service",
      service.id,
      `Created service "${name}"`,
    );

    revalidatePath("/dashboard/services");

    return { ok: true as const, serviceId: service.id };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create service.";
    return { ok: false as const, error: message };
  }
}

export async function updateService(id: string, data: FormData) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const name = (data.get("name") as string)?.trim() || "";
  const slug = (data.get("slug") as string)?.trim() || generateSlug(name);
  const categoryId = (data.get("categoryId") as string) || null;
  const shortDescription = (data.get("shortDescription") as string) || "";
  const fullDescription = (data.get("fullDescription") as string) || "";
  const priceInput = parseFloat(data.get("price") as string) || 0;
  const priceCents = Math.round(priceInput * 100);
  const durationMinutes = parseInt(data.get("duration") as string) || null;
  const benefitsRaw = (data.get("benefits") as string) || "";
  const benefits = benefitsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const whatToExpect = (data.get("whatToExpect") as string) || null;
  const preparation = (data.get("preparation") as string) || null;
  const safetyInformation = (data.get("safetyInformation") as string) || null;
  const publicVisible = data.get("publicVisible") === "on";
  const bookingEnabled = data.get("bookingEnabled") === "on";
  const featured = data.get("featured") === "on";
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;

  try {
    await db
      .update(services)
      .set({
        name,
        slug,
        categoryId,
        shortDescription,
        fullDescription,
        priceCents,
        durationMinutes,
        benefits,
        whatToExpect,
        preparation,
        safetyInformation,
        publicVisible,
        bookingEnabled,
        featured,
        sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id));

    await recordActivity(
      user.id,
      "update",
      "service",
      id,
      `Updated service "${name}"`,
    );

    revalidatePath("/dashboard/services");

    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update service.";
    return { ok: false as const, error: message };
  }
}

export async function archiveService(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [service] = await db
    .update(services)
    .set({
      archivedAt: new Date(),
      active: false,
      publicVisible: false,
      updatedAt: new Date(),
    })
    .where(eq(services.id, id))
    .returning({ name: services.name });

  if (service) {
    await recordActivity(
      user.id,
      "archive",
      "service",
      id,
      `Archived service "${service.name}"`,
    );
  }

  revalidatePath("/dashboard/services");
}

export async function toggleServiceActive(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [current] = await db
    .select({ active: services.active, name: services.name })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (current) {
    await db
      .update(services)
      .set({ active: !current.active, updatedAt: new Date() })
      .where(eq(services.id, id));

    await recordActivity(
      user.id,
      "update",
      "service",
      id,
      `${current.active ? "Deactivated" : "Activated"} service "${current.name}"`,
    );
  }

  revalidatePath("/dashboard/services");
}

export async function toggleServicePublic(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [current] = await db
    .select({ publicVisible: services.publicVisible, name: services.name })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (current) {
    await db
      .update(services)
      .set({ publicVisible: !current.publicVisible, updatedAt: new Date() })
      .where(eq(services.id, id));

    await recordActivity(
      user.id,
      "update",
      "service",
      id,
      `Made service "${current.name}" ${current.publicVisible ? "private" : "public"}`,
    );
  }

  revalidatePath("/dashboard/services");
}

export async function reorderServices(ids: string[]) {
  await requirePermission("services:manage");
  const db = getDb();

  for (let i = 0; i < ids.length; i++) {
    await db
      .update(services)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(eq(services.id, ids[i]));
  }

  revalidatePath("/dashboard/services");
}
