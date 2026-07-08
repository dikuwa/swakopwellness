"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import sizeOf from "image-size";
import { verifyPassword, hashPassword } from "@/auth/password";
import { requireAuth } from "@/auth/session";
import { getDb } from "@/db/client";
import { mediaAssets, users } from "@/db/schema";
import { uploadFile } from "@/lib/storage";
import { recordActivity } from "@/activity-log/record";

const avatarTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const maxAvatarSize = 4 * 1024 * 1024;

async function detectImageDimensions(buffer: Uint8Array) {
  try {
    const dimensions = sizeOf(Buffer.from(buffer));
    return { width: dimensions.width ?? null, height: dimensions.height ?? null };
  } catch {
    return { width: null, height: null };
  }
}

export async function updateProfile(formData: FormData) {
  const user = await requireAuth();
  const db = getDb();

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const removeAvatar = formData.get("removeAvatar") === "on";
  const avatar = formData.get("avatar") as File | null;

  if (name.length < 2) {
    return { ok: false as const, error: "Name must be at least 2 characters." };
  }

  let avatarMediaId: string | null | undefined;

  if (removeAvatar) {
    avatarMediaId = null;
  } else if (avatar && avatar.size > 0) {
    if (!avatarTypes.includes(avatar.type)) {
      return { ok: false as const, error: "Avatar must be a JPEG, PNG, WebP, or AVIF image." };
    }
    if (avatar.size > maxAvatarSize) {
      return { ok: false as const, error: "Avatar must be 4MB or smaller." };
    }

    const ext = avatar.name.split(".").pop() || "jpg";
    const key = `avatars/${user.id}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await avatar.arrayBuffer());
    const body = new Uint8Array(buffer);
    const publicUrl = await uploadFile(key, body, avatar.type);
    const { width, height } = await detectImageDimensions(body);

    const [asset] = await db
      .insert(mediaAssets)
      .values({
        storageKey: key,
        publicUrl,
        altText: `${name} profile picture`,
        mimeType: avatar.type,
        byteSize: avatar.size,
        width,
        height,
      })
      .returning({ id: mediaAssets.id });

    avatarMediaId = asset.id;
  }

  await db
    .update(users)
    .set({
      name,
      ...(avatarMediaId !== undefined ? { avatarMediaId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  await recordActivity(user.id, "profile_updated", "user", user.id, "Updated profile details");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");

  return { ok: true as const };
}

export async function updatePassword(formData: FormData) {
  const user = await requireAuth();
  const db = getDb();

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false as const, error: "Complete all password fields." };
  }
  if (newPassword.length < 8) {
    return { ok: false as const, error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false as const, error: "New passwords do not match." };
  }

  const [account] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!account || !(await verifyPassword(currentPassword, account.passwordHash))) {
    return { ok: false as const, error: "Current password is incorrect." };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await recordActivity(user.id, "password_updated", "user", user.id, "Updated own password");
  revalidatePath("/dashboard/profile");

  return { ok: true as const };
}
