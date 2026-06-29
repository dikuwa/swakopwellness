"use server";

import { redirect } from "next/navigation";
import { createChatBookingRequest } from "@/chatbot/create";

export async function submitChatBookingRequest(formData: FormData) {
  const result = await createChatBookingRequest(formData);

  if (!result.ok) {
    redirect(`/chat?error=${encodeURIComponent(result.message)}`);
  }

  redirect(`/chat?reference=${encodeURIComponent(result.reference)}&status=${encodeURIComponent(result.status)}`);
}
