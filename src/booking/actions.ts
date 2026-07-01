"use server";

import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { bookings, bookingStatusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordActivity } from "@/activity-log/record";
import { notifyStaff } from "@/notifications/create";
import { validTransitions } from "./status";

type TxResult = { ok: false; error: string } | { ok: true };

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
  }
}

export async function confirmBooking(bookingId: string): Promise<void> {
  await transitionBookingStatus(bookingId, "confirmed");
}

export async function cancelBooking(formData: FormData): Promise<void> {
  const bookingId = formData.get("bookingId") as string;
  const reason = (formData.get("reason") as string) || "No reason provided";
  await transitionBookingStatus(bookingId, "cancelled", reason);
}

export async function markCompleted(bookingId: string): Promise<void> {
  await transitionBookingStatus(bookingId, "completed");
}

export async function markNoShow(bookingId: string): Promise<void> {
  await transitionBookingStatus(bookingId, "no_show");
}

export async function changeBookingStatus(formData: FormData): Promise<void> {
  const bookingId = formData.get("bookingId") as string;
  const newStatus = formData.get("newStatus") as string;
  await transitionBookingStatus(bookingId, newStatus);
}
