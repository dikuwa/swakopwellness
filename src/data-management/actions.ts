"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/auth/session";
import { getDb } from "@/db/client";
import {
  activityLog,
  bookingAnswers,
  bookingStatusHistory,
  bookings,
  chatConversations,
  chatMessages,
  chatToolEvents,
  documentLineItems,
  documentNumberSequences,
  documents,
  followUps,
  invoiceLineItems,
  invoices,
  notifications,
  payments,
  quotationLineItems,
  quotations,
  receiptLineItems,
  receipts,
} from "@/db/schema";
import { recordActivity } from "@/activity-log/record";

const confirmationPhrase = "CLEAR SWAKOP DATA";

export type DataManagementCounts = {
  bookings: number;
  followUps: number;
  chatConversations: number;
  documents: number;
  invoices: number;
  quotations: number;
  receipts: number;
  payments: number;
  notifications: number;
  activityLogs: number;
  orphanClients: number;
};

export type CleanupResult = {
  ok: boolean;
  error?: string;
  deleted?: Partial<DataManagementCounts> & { documentSequencesReset?: number };
};

async function tableCount(tableSql: ReturnType<typeof sql>) {
  const db = getDb();
  const result = await db.execute(sql<{ count: number }>`select count(*)::int as count from ${tableSql}`);
  return Number(result[0]?.count ?? 0);
}

export async function getDataManagementCounts(): Promise<DataManagementCounts> {
  await requireOwner();
  const db = getDb();
  const orphanClientRows = await db.execute(sql<{ count: number }>`
    select count(*)::int as count
    from clients c
    where not exists (select 1 from bookings b where b.client_id = c.id)
      and not exists (select 1 from follow_ups f where f.client_id = c.id)
      and not exists (select 1 from invoices i where i.client_id = c.id)
      and not exists (select 1 from quotations q where q.client_id = c.id)
      and not exists (select 1 from receipts r where r.client_id = c.id)
      and not exists (select 1 from payments p where p.client_id = c.id)
      and not exists (select 1 from documents d where d.client_id = c.id)
      and not exists (select 1 from chat_conversations cc where cc.client_id = c.id)
  `);

  return {
    bookings: await tableCount(sql`bookings`),
    followUps: await tableCount(sql`follow_ups`),
    chatConversations: await tableCount(sql`chat_conversations`),
    documents: await tableCount(sql`documents`),
    invoices: await tableCount(sql`invoices`),
    quotations: await tableCount(sql`quotations`),
    receipts: await tableCount(sql`receipts`),
    payments: await tableCount(sql`payments`),
    notifications: await tableCount(sql`notifications`),
    activityLogs: await tableCount(sql`activity_log`),
    orphanClients: Number(orphanClientRows[0]?.count ?? 0),
  };
}

export async function clearSelectedData(formData: FormData): Promise<CleanupResult> {
  const user = await requireOwner();
  const db = getDb();

  const confirmation = (formData.get("confirmation") as string | null)?.trim();
  if (confirmation !== confirmationPhrase) {
    return { ok: false, error: `Type ${confirmationPhrase} to confirm.` };
  }

  const clearOperations = formData.get("operations") === "on";
  const clearFinance = formData.get("finance") === "on";
  const clearNotifications = formData.get("notifications") === "on";
  const clearActivity = formData.get("activity") === "on";
  const clearOrphanClients = formData.get("orphanClients") === "on";
  const resetDocumentSequences = formData.get("resetDocumentSequences") === "on";

  if (!clearOperations && !clearFinance && !clearNotifications && !clearActivity && !clearOrphanClients && !resetDocumentSequences) {
    return { ok: false, error: "Choose at least one data group to clear." };
  }

  const deleted: CleanupResult["deleted"] = {};

  await db.transaction(async (tx) => {
    if (clearFinance) {
      deleted.documents = (await tx.delete(documents).returning({ id: documents.id })).length;
      await tx.delete(documentLineItems);

      await tx.update(quotations).set({ convertedToInvoiceId: null });
      await tx.delete(receiptLineItems);
      deleted.receipts = (await tx.delete(receipts).returning({ id: receipts.id })).length;
      deleted.payments = (await tx.delete(payments).returning({ id: payments.id })).length;
      await tx.delete(invoiceLineItems);
      deleted.invoices = (await tx.delete(invoices).returning({ id: invoices.id })).length;
      await tx.delete(quotationLineItems);
      deleted.quotations = (await tx.delete(quotations).returning({ id: quotations.id })).length;
    }

    if (clearOperations) {
      await tx.delete(chatMessages);
      await tx.delete(chatToolEvents);
      deleted.chatConversations = (await tx.delete(chatConversations).returning({ id: chatConversations.id })).length;
      deleted.followUps = (await tx.delete(followUps).returning({ id: followUps.id })).length;
      await tx.delete(bookingAnswers);
      await tx.delete(bookingStatusHistory);
      deleted.bookings = (await tx.delete(bookings).returning({ id: bookings.id })).length;
    }

    if (clearNotifications) {
      deleted.notifications = (await tx.delete(notifications).returning({ id: notifications.id })).length;
    }

    if (clearActivity) {
      deleted.activityLogs = (await tx.delete(activityLog).returning({ id: activityLog.id })).length;
    }

    if (clearOrphanClients) {
      const removed = await tx.execute(sql<{ id: string }>`
        delete from clients c
        where not exists (select 1 from bookings b where b.client_id = c.id)
          and not exists (select 1 from follow_ups f where f.client_id = c.id)
          and not exists (select 1 from invoices i where i.client_id = c.id)
          and not exists (select 1 from quotations q where q.client_id = c.id)
          and not exists (select 1 from receipts r where r.client_id = c.id)
          and not exists (select 1 from payments p where p.client_id = c.id)
          and not exists (select 1 from documents d where d.client_id = c.id)
          and not exists (select 1 from chat_conversations cc where cc.client_id = c.id)
        returning id
      `);
      deleted.orphanClients = removed.length;
    }

    if (resetDocumentSequences) {
      deleted.documentSequencesReset = (await tx.update(documentNumberSequences).set({ nextNumber: 1, updatedAt: new Date() }).returning({ id: documentNumberSequences.id })).length;
    }
  });

  if (!clearActivity) {
    await recordActivity(
      user.id,
      "data_management_cleanup",
      "system",
      undefined,
      "Ran Owner data management cleanup",
      deleted,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings/data-management");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/activity-log");

  return { ok: true, deleted };
}
