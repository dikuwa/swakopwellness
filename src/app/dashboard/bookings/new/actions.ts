"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/auth/session";
import { createBookingRequest, formDataToBookingInput } from "@/booking/create";

export async function createManualBookingAction(formData: FormData) {
  await requirePermission("bookings:create");

  const result = await createBookingRequest(formDataToBookingInput(formData), "manual_admin");
  if (!result.ok) {
    redirect(`/dashboard/bookings/new?error=${encodeURIComponent(result.message)}`);
  }

  redirect(`/dashboard/bookings/${result.bookingId}`);
}
