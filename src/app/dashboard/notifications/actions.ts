"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/auth/session";
import { getDb } from "@/db/client";
import {
  bookings,
  chatConversations,
  clients,
  documents,
  followUps,
  invoices,
  notifications,
  payments,
  quotations,
  receipts,
} from "@/db/schema";

type ResolveResult = { ok: true; href: string } | { ok: false; error: string };

function routeForEntity(entityType: string | null, entityId: string | null) {
  if (!entityType || !entityId) return null;
  const normalized = entityType.toLowerCase().replaceAll("-", "_");

  switch (normalized) {
    case "booking":
      return { href: `/dashboard/bookings/${entityId}`, type: "booking" };
    case "payment":
      return { href: `/dashboard/payments/${entityId}`, type: "payment" };
    case "invoice":
      return { href: `/dashboard/invoices/${entityId}`, type: "invoice" };
    case "quotation":
    case "quote":
      return { href: `/dashboard/quotations/${entityId}`, type: "quotation" };
    case "receipt":
      return { href: `/dashboard/receipts/${entityId}`, type: "receipt" };
    case "document":
      return { href: "/dashboard/documents", type: "document" };
    case "client":
      return { href: `/dashboard/clients/${entityId}`, type: "client" };
    case "follow_up":
    case "followup":
      return { href: "/dashboard/follow-ups", type: "follow_up" };
    case "chat":
    case "chat_conversation":
      return { href: `/dashboard/chat-conversations/${entityId}`, type: "chat_conversation" };
    default:
      return null;
  }
}

async function recordExists(entityType: string, entityId: string) {
  const db = getDb();

  switch (entityType) {
    case "booking": {
      const [record] = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.id, entityId)).limit(1);
      return Boolean(record);
    }
    case "payment": {
      const [record] = await db.select({ id: payments.id }).from(payments).where(eq(payments.id, entityId)).limit(1);
      return Boolean(record);
    }
    case "invoice": {
      const [record] = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.id, entityId)).limit(1);
      return Boolean(record);
    }
    case "quotation": {
      const [record] = await db.select({ id: quotations.id }).from(quotations).where(eq(quotations.id, entityId)).limit(1);
      return Boolean(record);
    }
    case "receipt": {
      const [record] = await db.select({ id: receipts.id }).from(receipts).where(eq(receipts.id, entityId)).limit(1);
      return Boolean(record);
    }
    case "document": {
      const [record] = await db.select({ id: documents.id }).from(documents).where(eq(documents.id, entityId)).limit(1);
      return Boolean(record);
    }
    case "client": {
      const [record] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, entityId)).limit(1);
      return Boolean(record);
    }
    case "follow_up": {
      const [record] = await db.select({ id: followUps.id }).from(followUps).where(eq(followUps.id, entityId)).limit(1);
      return Boolean(record);
    }
    case "chat_conversation": {
      const [record] = await db.select({ id: chatConversations.id }).from(chatConversations).where(eq(chatConversations.id, entityId)).limit(1);
      return Boolean(record);
    }
    default:
      return false;
  }
}

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

export async function markNotificationUnread(id: string) {
  const user = await requireAuth();
  const db = getDb();

  await db
    .update(notifications)
    .set({ readAt: null })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));

  revalidatePath("/dashboard/notifications");
}

export async function removeNotification(id: string) {
  const user = await requireAuth();
  const db = getDb();

  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));

  revalidatePath("/dashboard/notifications");
}

export async function resolveNotificationTarget(id: string): Promise<ResolveResult> {
  const user = await requireAuth();
  const db = getDb();

  const [notification] = await db
    .select({
      id: notifications.id,
      entityType: notifications.entityType,
      entityId: notifications.entityId,
      readAt: notifications.readAt,
    })
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
    .limit(1);

  if (!notification) return { ok: false, error: "This notification is no longer available." };

  const target = routeForEntity(notification.entityType, notification.entityId);
  if (!target) return { ok: false, error: "This notification is not linked to a record." };

  if (!notification.entityId || !(await recordExists(target.type, notification.entityId))) {
    return { ok: false, error: "This record is no longer available." };
  }

  if (!notification.readAt) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
    revalidatePath("/dashboard/notifications");
  }

  return { ok: true, href: target.href };
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
