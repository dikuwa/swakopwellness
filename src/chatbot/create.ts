import { eq } from "drizzle-orm";
import { createBookingRequest, formDataToBookingInput } from "@/booking/create";
import { getDb } from "@/db/client";
import { chatConversations, chatMessages, chatToolEvents } from "@/db/schema";
import { approvedBookingSummary } from "./safety";

export async function createChatBookingRequest(formData: FormData) {
  const db = getDb();
  const [conversation] = await db.insert(chatConversations).values({ status: "booking_started" }).returning({ id: chatConversations.id });

  await db.insert(chatMessages).values([
    { conversationId: conversation.id, role: "assistant", content: "I can help collect a booking request using approved service information." },
    { conversationId: conversation.id, role: "user", content: "Submitted chatbot booking request form." },
  ]);

  const result = await createBookingRequest(formDataToBookingInput(formData), "website_form");

  await db.insert(chatToolEvents).values({
    conversationId: conversation.id,
    toolName: "createBookingRequest",
    status: result.ok ? "success" : "error",
    summary: result.ok ? `Created booking request ${result.reference}` : result.message,
  });

  if (!result.ok) {
    await db.insert(chatMessages).values({ conversationId: conversation.id, role: "assistant", content: result.message });
    return result;
  }

  await db.update(chatConversations).set({ bookingId: result.bookingId, clientId: result.clientId, status: "booking_requested", updatedAt: new Date() }).where(eq(chatConversations.id, conversation.id));
  await db.insert(chatMessages).values({ conversationId: conversation.id, role: "assistant", content: approvedBookingSummary(result.reference, result.status) });

  return result;
}
