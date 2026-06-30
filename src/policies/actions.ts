"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { policies } from "@/db/schema";
import { recordActivity } from "@/activity-log/record";

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function createPolicy(data: FormData) {
  const user = await requirePermission("settings:manage");
  const db = getDb();

  const title = (data.get("title") as string)?.trim();
  if (!title) return { ok: false as const, error: "Title is required." };

  const slug = (data.get("slug") as string)?.trim() || generateSlug(title);

  const body = (data.get("body") as string)?.trim();
  if (!body) return { ok: false as const, error: "Body is required." };

  const publicVisible = data.get("publicVisible") === "on";

  const [existing] = await db
    .select({ id: policies.id })
    .from(policies)
    .where(eq(policies.slug, slug))
    .limit(1);

  if (existing) {
    return { ok: false as const, error: "A policy with this slug already exists." };
  }

  try {
    const [policy] = await db
      .insert(policies)
      .values({ title, slug, body, publicVisible })
      .returning({ id: policies.id });

    await recordActivity(
      user.id,
      "create",
      "policy",
      policy.id,
      `Created policy "${title}"`,
    );

    revalidatePath("/dashboard/policies");
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create policy.";
    return { ok: false as const, error: message };
  }
}

export async function updatePolicy(id: string, data: FormData) {
  const user = await requirePermission("settings:manage");
  const db = getDb();

  const title = (data.get("title") as string)?.trim();
  if (!title) return { ok: false as const, error: "Title is required." };

  const slug = (data.get("slug") as string)?.trim() || generateSlug(title);

  const body = (data.get("body") as string)?.trim();
  if (!body) return { ok: false as const, error: "Body is required." };

  const publicVisible = data.get("publicVisible") === "on";

  const [existing] = await db
    .select({ id: policies.id })
    .from(policies)
    .where(eq(policies.slug, slug))
    .limit(1);

  if (existing && existing.id !== id) {
    return { ok: false as const, error: "A policy with this slug already exists." };
  }

  try {
    await db
      .update(policies)
      .set({ title, slug, body, publicVisible, updatedAt: new Date() })
      .where(eq(policies.id, id));

    await recordActivity(
      user.id,
      "update",
      "policy",
      id,
      `Updated policy "${title}"`,
    );

    revalidatePath("/dashboard/policies");
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update policy.";
    return { ok: false as const, error: message };
  }
}

export async function togglePolicyPublic(id: string) {
  const user = await requirePermission("settings:manage");
  const db = getDb();

  const [current] = await db
    .select({ publicVisible: policies.publicVisible, title: policies.title })
    .from(policies)
    .where(eq(policies.id, id))
    .limit(1);

  if (current) {
    await db
      .update(policies)
      .set({ publicVisible: !current.publicVisible, updatedAt: new Date() })
      .where(eq(policies.id, id));

    await recordActivity(
      user.id,
      "update",
      "policy",
      id,
      `Made policy "${current.title}" ${current.publicVisible ? "private" : "public"}`,
    );
  }

  revalidatePath("/dashboard/policies");
}

export async function deletePolicy(id: string) {
  const user = await requirePermission("settings:manage");
  const db = getDb();

  const [policy] = await db
    .delete(policies)
    .where(eq(policies.id, id))
    .returning({ title: policies.title });

  if (policy) {
    await recordActivity(
      user.id,
      "delete",
      "policy",
      id,
      `Deleted policy "${policy.title}"`,
    );
  }

  revalidatePath("/dashboard/policies");
}
