"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/auth/session";
import { getDb } from "@/db/client";
import { notifications } from "@/db/schema";

export async function markAllAsRead() {
  const user = await requireAuth();
  const db = getDb();

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, user.id),
        sql`${notifications.readAt} IS NULL`,
      ),
    );

  revalidatePath("/dashboard/notifications");
}

export async function markNotificationRead(id: string) {
  const user = await requireAuth();
  const db = getDb();

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));

  revalidatePath("/dashboard/notifications");
}

export async function clearReadNotifications() {
  const user = await requireAuth();
  const db = getDb();

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.userId, user.id),
        sql`${notifications.readAt} IS NOT NULL`,
      ),
    );

  revalidatePath("/dashboard/notifications");
}
