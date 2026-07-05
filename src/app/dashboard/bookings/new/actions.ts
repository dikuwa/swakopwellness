"use server";

import { requirePermission } from "@/auth/session";
import { createBookingRequest, formDataToBookingInput } from "@/booking/create";

interface ActionResult {
  success: boolean;
  error?: string;
  bookingId?: string;
}

export async function createManualBookingAction(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("bookings:create");

    const result = await createBookingRequest(formDataToBookingInput(formData), "manual_admin");
    if (!result.ok) {
      return { success: false, error: result.message };
    }

    // Revalidation should happen inside createBookingRequest or be called here
    // For now, we will redirect on the client side after success.
    return { success: true, bookingId: result.bookingId };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "An unknown error occurred." };
  }
}
