"use server";

import { requireAuth } from "@/auth/session";
import { getDb } from "@/db/client";
import { bookings, bookingStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordActivity } from "@/activity-log/record";
import { notifyStaff } from "@/notifications/create";
import { validTransitions } from "./status";

type TransitionResult = { ok: true; reference: string } | { ok: false; error: string };
type TxResult = { ok: false; error: string } | { ok: true };

async function transitionBookingStatus(
  bookingId: string,
  newStatus: string,
  note?: string,
): Promise<TransitionResult> {
  const user = await requireAuth();
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

  if (!result.ok) return { ok: false as const, error: result.error };

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
  }

  return { ok: true as const, reference: reference! };
}

export async function confirmBooking(bookingId: string): Promise<TransitionResult> {
  return transitionBookingStatus(bookingId, "confirmed");
}

export async function cancelBooking(formData: FormData): Promise<TransitionResult> {
  const bookingId = formData.get("bookingId") as string;
  const reason = (formData.get("reason") as string) || "No reason provided";
  return transitionBookingStatus(bookingId, "cancelled", reason);
}

export async function markCompleted(bookingId: string): Promise<TransitionResult> {
  return transitionBookingStatus(bookingId, "completed");
}

export async function markNoShow(bookingId: string): Promise<TransitionResult> {
  return transitionBookingStatus(bookingId, "no_show");
}

export async function changeBookingStatus(formData: FormData): Promise<TransitionResult> {
  const bookingId = formData.get("bookingId") as string;
  const newStatus = formData.get("newStatus") as string;
  return transitionBookingStatus(bookingId, newStatus);
}
