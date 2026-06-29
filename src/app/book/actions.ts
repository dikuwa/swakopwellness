"use server";

import { redirect } from "next/navigation";
import { createBookingRequest, formDataToBookingInput } from "@/booking/create";

export async function submitBookingRequest(formData: FormData) {
  const result = await createBookingRequest(formDataToBookingInput(formData), "website_form");

  if (!result.ok) {
    redirect(`/book?error=${encodeURIComponent(result.message)}`);
  }

  redirect(`/book?reference=${encodeURIComponent(result.reference)}&status=${encodeURIComponent(result.status)}`);
}
