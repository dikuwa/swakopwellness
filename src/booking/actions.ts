"use server";

import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { bookings, bookingStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordActivity } from "@/activity-log/record";
import { notifyStaff } from "@/notifications/create";
import { validTransitions } from "./status";

export type TxResult = { ok: false; error: string } | { ok: true };

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

  const newPreferredAt = new Date(`${newDate}T${newTime}`);
  if (isNaN(newPreferredAt.getTime())) {
    throw new Error("Invalid date or time format provided.");
  }

  let fromStatus: string | undefined;
  let reference: string | undefined;

  const result: TxResult = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select({ id: bookings.id, status: bookings.status, reference: bookings.reference })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) return { ok: false, error: "Booking not found." };

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
      note: `Rescheduled to ${newPreferredAt.toLocaleString("en-GB")}. Reason: ${reason || "Not specified"}`,
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
