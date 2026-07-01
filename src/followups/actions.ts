"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordActivity } from "@/activity-log/record";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { bookings, clients, followUps } from "@/db/schema";

type FollowUpActionResult = { ok: true } | { ok: false; error: string };

function readText(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseDueAt(data: FormData) {
  const dueDate = readText(data, "dueDate");
  const dueTime = readText(data, "dueTime");
  if (!dueDate || !dueTime) return null;

  const dueAt = new Date(`${dueDate}T${dueTime}`);
  return Number.isNaN(dueAt.getTime()) ? null : dueAt;
}

export async function createFollowUp(data: FormData): Promise<FollowUpActionResult> {
  const user = await requirePermission("bookings:update");
  const db = getDb();

  const clientId = readText(data, "clientId");
  const bookingId = readText(data, "bookingId") || null;
  const dueAt = parseDueAt(data);
  const method = readText(data, "method");
  const internalNote = readText(data, "internalNote") || null;

  if (!clientId) return { ok: false, error: "Client is required." };
  if (!dueAt) return { ok: false, error: "A valid due date and time is required." };
  if (!method) return { ok: false, error: "Method is required." };

  const [client] = await db.select({ id: clients.id, fullName: clients.fullName }).from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) return { ok: false, error: "Client not found." };

  if (bookingId) {
    const [booking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.clientId, clientId)))
      .limit(1);

    if (!booking) return { ok: false, error: "Booking not found for this client." };
  }

  const [followUp] = await db
    .insert(followUps)
    .values({
      clientId,
      bookingId,
      dueAt,
      method,
      assignedUserId: user.id,
      internalNote,
      status: "pending",
      reminderAt: null,
      completedAt: null,
      cancelledAt: null,
    })
    .returning({ id: followUps.id });

  await recordActivity(user.id, "follow_up.create", "follow_up", followUp.id, `Created follow-up for ${client.fullName}`);
  revalidatePath("/dashboard/follow-ups");

  return { ok: true };
}


async function setPendingFollowUpStatus(id: string, status: "completed" | "cancelled"): Promise<FollowUpActionResult> {
  const user = await requirePermission("bookings:update");
  const db = getDb();
  const now = new Date();

  const [followUp] = await db.select({ id: followUps.id, status: followUps.status }).from(followUps).where(eq(followUps.id, id)).limit(1);
  if (!followUp) return { ok: false, error: "Follow-up not found." };
  if (followUp.status !== "pending") return { ok: false, error: "Only pending follow-ups can be changed." };

  await db
    .update(followUps)
    .set({
      status,
      completedAt: status === "completed" ? now : null,
      cancelledAt: status === "cancelled" ? now : null,
      updatedAt: now,
    })
    .where(eq(followUps.id, id));

  await recordActivity(user.id, `follow_up.${status}`, "follow_up", id, `Marked follow-up ${status}`);
  revalidatePath("/dashboard/follow-ups");

  return { ok: true };
}

export async function completeFollowUp(id: string): Promise<FollowUpActionResult> {
  return setPendingFollowUpStatus(id, "completed");
}

export async function cancelFollowUp(id: string): Promise<FollowUpActionResult> {
  return setPendingFollowUpStatus(id, "cancelled");
}
