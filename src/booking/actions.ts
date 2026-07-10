"use server";

import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { bookings, bookingStatusHistory, services } from "@/db/schema";
import { and, eq, lt, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordActivity } from "@/activity-log/record";
import { notifyStaff } from "@/notifications/create";
import { formatBusinessDateTime, parseBusinessDateTime } from "@/lib/business-time";
import { validTransitions } from "./status";

export type TxResult = { ok: false; error: string } | { ok: true };

function parseDateTimeFields(dateValue: string, timeValue: string) {
  return parseBusinessDateTime(dateValue, timeValue);
}

const editableBookingStatuses = ["new_request", "requires_review", "contacting_client", "awaiting_client_response", "confirmed", "rescheduled"];
const conflictStatuses = ["new_request", "requires_review", "contacting_client", "awaiting_client_response", "confirmed", "rescheduled"];

async function transitionBookingStatus(
  bookingId: string,
  newStatus: string,
  note?: string,
): Promise<void> {
  const user = await requirePermission("bookings:update");
  const db = getDb();

  let fromStatus: string | undefined;
  let reference: string | undefined;

  const result: TxResult = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select({ id: bookings.id, status: bookings.status, reference: bookings.reference })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) return { ok: false as const, error: "Booking not found." };

    const allowed = validTransitions[booking.status];
    if (!allowed || !allowed.includes(newStatus)) {
      return {
        ok: false as const,
        error: `Cannot transition from "${booking.status}" to "${newStatus}".`,
      };
    }

    await tx
      .update(bookings)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(bookings.id, bookingId));

    await tx.insert(bookingStatusHistory).values({
      bookingId,
      fromStatus: booking.status,
      toStatus: newStatus,
      actorUserId: user.id,
      note: note ?? null,
    });

    fromStatus = booking.status;
    reference = booking.reference;

    return { ok: true as const };
  });

  if (!result.ok) throw new Error(result.error);

  if (reference && fromStatus) {
    recordActivity(
      user.id,
      `booking.status.${newStatus}`,
      "booking",
      bookingId,
      `Booking ${reference}: ${fromStatus} → ${newStatus}${note ? ` — ${note}` : ""}`,
    );

    await notifyStaff(
      `booking.status.${newStatus}`,
      `Booking ${reference} ${newStatus.replaceAll("_", " ")}`,
      `Booking ${reference} status changed from ${fromStatus.replaceAll("_", " ")} to ${newStatus.replaceAll("_", " ")}${note ? ` — ${note}` : ""}`,
      "booking",
      bookingId,
    );

    revalidatePath("/dashboard/bookings");
    revalidatePath(`/dashboard/bookings/${bookingId}`);
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard");
  }
}

export async function confirmBooking(bookingId: string): Promise<void> {
  await transitionBookingStatus(bookingId, "confirmed");
}

export async function cancelBooking(formData: FormData): Promise<void> {
  const bookingId = formData.get("bookingId") as string;
  const reason = (formData.get("reason") as string) || "No reason provided";
  if (!bookingId) throw new Error("Booking ID is missing.");
  await transitionBookingStatus(bookingId, "cancelled", reason);
}

export async function markCompleted(bookingId: string): Promise<void> {
  await transitionBookingStatus(bookingId, "completed");
}

export async function markNoShow(formData: FormData): Promise<void> {
  const bookingId = formData.get("bookingId") as string;
  const reason = (formData.get("reason") as string) || "No reason provided";
  if (!bookingId) throw new Error("Booking ID is missing.");
  await transitionBookingStatus(bookingId, "no_show", reason);
}

export async function changeBookingStatus(formData: FormData): Promise<void> {
  const bookingId = formData.get("bookingId") as string;
  const newStatus = formData.get("newStatus") as string;
  const reason = formData.get("reason") as string | undefined;
  await transitionBookingStatus(bookingId, newStatus, reason || undefined);
}

export async function rescheduleBooking(formData: FormData): Promise<void> {
  const user = await requirePermission("bookings:update");
  const db = getDb();
  
  const bookingId = formData.get("bookingId") as string;
  const newDate = formData.get("newDate") as string; // Expect ISO date string YYYY-MM-DD
  const newTime = formData.get("newTime") as string; // Expect HH:mm
  const reason = formData.get("reason") as string;

  if (!bookingId || !newDate || !newTime) {
    throw new Error("Missing required fields for rescheduling.");
  }

  const newPreferredAt = parseDateTimeFields(newDate, newTime);
  if (!newPreferredAt) {
    throw new Error("Invalid date or time format provided.");
  }
  if (newPreferredAt.getTime() <= Date.now()) {
    throw new Error("Choose a future date and time.");
  }

  let fromStatus: string | undefined;
  let reference: string | undefined;

  const result: TxResult = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select({
        id: bookings.id,
        status: bookings.status,
        reference: bookings.reference,
        serviceId: bookings.serviceId,
        serviceDurationMinutes: bookings.serviceDurationMinutes,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) return { ok: false, error: "Booking not found." };
    if (!editableBookingStatuses.includes(booking.status)) {
      return { ok: false, error: "Completed, cancelled, and no-show bookings cannot be rescheduled." };
    }
    if (!booking.serviceId) {
      return { ok: false, error: "This booking has no linked service to check for schedule conflicts." };
    }

    const durationMinutes = booking.serviceDurationMinutes ?? 30;
    const newEnd = new Date(newPreferredAt.getTime() + durationMinutes * 60 * 1000);
    const [conflict] = await tx
      .select({ reference: bookings.reference })
      .from(bookings)
      .where(
        and(
          ne(bookings.id, bookingId),
          eq(bookings.serviceId, booking.serviceId),
          or(...conflictStatuses.map((status) => eq(bookings.status, status))),
          lt(bookings.preferredAt, newEnd),
          sql`${newPreferredAt.toISOString()} < ${bookings.preferredAt} + coalesce(${bookings.serviceDurationMinutes}, 30) * interval '1 minute'`,
        ),
      )
      .limit(1);
    if (conflict) {
      return { ok: false, error: `Time conflict: ${conflict.reference} already overlaps this service and time.` };
    }

    await tx
      .update(bookings)
      .set({ 
        status: "rescheduled", 
        preferredAt: newPreferredAt,
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, bookingId));

    await tx.insert(bookingStatusHistory).values({
      bookingId,
      fromStatus: booking.status,
      toStatus: "rescheduled",
      actorUserId: user.id,
      note: `Rescheduled to ${formatBusinessDateTime(newPreferredAt)}. Reason: ${reason || "Not specified"}`,
    });

    fromStatus = booking.status;
    reference = booking.reference;

    return { ok: true };
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  if (reference && fromStatus) {
    recordActivity(
      user.id,
      `booking.status.rescheduled`,
      "booking",
      bookingId,
      `Booking ${reference} rescheduled from ${fromStatus} to rescheduled`,
    );

    await notifyStaff(
      `booking.status.rescheduled`,
      `Booking ${reference} Rescheduled`,
      `Booking ${reference} was rescheduled.`,
      "booking",
      bookingId,
    );

    revalidatePath("/dashboard/bookings");
    revalidatePath(`/dashboard/bookings/${bookingId}`);
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard"); // For overview stats
  }
}

export async function updateBookingDetails(formData: FormData): Promise<void> {
  const user = await requirePermission("bookings:update");
  const db = getDb();

  const bookingId = String(formData.get("bookingId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const preferredDate = String(formData.get("preferredDate") ?? "");
  const preferredTime = String(formData.get("preferredTime") ?? "");
  const alternativeDate = String(formData.get("alternativeDate") ?? "");
  const alternativeTime = String(formData.get("alternativeTime") ?? "");
  const preferredContactMethod = String(formData.get("preferredContactMethod") ?? "phone");
  const clientType = formData.get("clientType") === "returning" ? "returning" : "new";
  const note = String(formData.get("note") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!bookingId || !serviceId || !preferredDate || !preferredTime) {
    throw new Error("Booking, service, preferred date and preferred time are required.");
  }
  if (!["phone", "email", "whatsapp"].includes(preferredContactMethod)) {
    throw new Error("Choose a valid preferred contact method.");
  }

  const preferredAt = parseDateTimeFields(preferredDate, preferredTime);
  if (!preferredAt) throw new Error("Choose a valid preferred date and time.");
  if (preferredAt.getTime() <= Date.now()) throw new Error("Choose a future preferred date and time.");

  let alternativeAt: Date | null = null;
  if (alternativeDate || alternativeTime) {
    if (!alternativeDate || !alternativeTime) throw new Error("Alternative date and time must both be set, or both left blank.");
    alternativeAt = parseDateTimeFields(alternativeDate, alternativeTime);
    if (!alternativeAt) throw new Error("Choose a valid alternative date and time.");
  }

  let reference: string | undefined;
  let historyNote = "";
  let nextStatus = "";

  const result: TxResult = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select({
        id: bookings.id,
        reference: bookings.reference,
        status: bookings.status,
        serviceId: bookings.serviceId,
        serviceName: bookings.serviceName,
        preferredAt: bookings.preferredAt,
        serviceDurationMinutes: bookings.serviceDurationMinutes,
        preferredContactMethod: bookings.preferredContactMethod,
        clientType: bookings.clientType,
        note: bookings.note,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);
    if (!booking) return { ok: false as const, error: "Booking not found." };
    if (!editableBookingStatuses.includes(booking.status)) {
      return { ok: false as const, error: "Completed, cancelled, and no-show bookings cannot be rescheduled or reassigned." };
    }

    const [service] = await tx
      .select({
        id: services.id,
        name: services.name,
        priceCents: services.priceCents,
        durationMinutes: services.durationMinutes,
      })
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.active, true)))
      .limit(1);
    if (!service) return { ok: false as const, error: "Choose an active service." };

    const durationMinutes = service.durationMinutes ?? 30;
    const newEnd = new Date(preferredAt.getTime() + durationMinutes * 60 * 1000);
    const [conflict] = await tx
      .select({ reference: bookings.reference, status: bookings.status })
      .from(bookings)
      .where(
        and(
          ne(bookings.id, bookingId),
          eq(bookings.serviceId, service.id),
          or(...conflictStatuses.map((status) => eq(bookings.status, status))),
          lt(bookings.preferredAt, newEnd),
          sql`${preferredAt.toISOString()} < ${bookings.preferredAt} + coalesce(${bookings.serviceDurationMinutes}, 30) * interval '1 minute'`,
        ),
      )
      .limit(1);
    if (conflict) {
      return { ok: false as const, error: `Time conflict: ${conflict.reference} already overlaps this service and time.` };
    }

    const timeChanged = booking.preferredAt.getTime() !== preferredAt.getTime();
    const serviceChanged = booking.serviceId !== service.id;
    nextStatus = timeChanged ? "rescheduled" : booking.status;

    const changes = [
      timeChanged ? `Time: ${formatBusinessDateTime(booking.preferredAt)} -> ${formatBusinessDateTime(preferredAt)}` : null,
      serviceChanged ? `Service: ${booking.serviceName} -> ${service.name}` : null,
      booking.preferredContactMethod !== preferredContactMethod ? `Contact: ${booking.preferredContactMethod} -> ${preferredContactMethod}` : null,
      booking.clientType !== clientType ? `Client type: ${booking.clientType} -> ${clientType}` : null,
      (booking.note ?? "") !== note ? "Internal note updated" : null,
    ].filter(Boolean);

    await tx
      .update(bookings)
      .set({
        serviceId: service.id,
        serviceName: service.name,
        servicePriceCents: service.priceCents,
        serviceDurationMinutes: service.durationMinutes,
        preferredAt,
        alternativeAt,
        status: nextStatus,
        preferredContactMethod,
        clientType,
        note: note || null,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    historyNote = `${changes.length > 0 ? changes.join("; ") : "Booking details reviewed."}${reason ? ` Reason: ${reason}` : ""}`;
    await tx.insert(bookingStatusHistory).values({
      bookingId,
      fromStatus: booking.status,
      toStatus: nextStatus,
      actorUserId: user.id,
      note: historyNote,
    });

    reference = booking.reference;
    return { ok: true as const };
  });

  if (!result.ok) throw new Error(result.error);

  await recordActivity(
    user.id,
    nextStatus === "rescheduled" ? "booking.rescheduled" : "booking.updated",
    "booking",
    bookingId,
    `Booking ${reference} updated — ${historyNote}`,
  );

  await notifyStaff(
    nextStatus === "rescheduled" ? "booking.rescheduled" : "booking.updated",
    `Booking ${reference} updated`,
    historyNote,
    "booking",
    bookingId,
  );

  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard");
}
