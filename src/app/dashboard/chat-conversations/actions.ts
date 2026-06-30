"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordActivity } from "@/activity-log/record";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { chatConversations } from "@/db/schema";

export async function updateChatConversationStatus(formData: FormData) {
  const user = await requirePermission("bookings:update");
  const conversationId = formData.get("conversationId") as string;
  const status = formData.get("status") as string;

  if (!conversationId || !["open", "closed"].includes(status)) {
    return { ok: false as const, error: "Invalid conversation status update." };
  }

  const db = getDb();
  const [conversation] = await db
    .update(chatConversations)
    .set({ status, updatedAt: new Date() })
    .where(eq(chatConversations.id, conversationId))
    .returning({ id: chatConversations.id, status: chatConversations.status });

  if (!conversation) return { ok: false as const, error: "Conversation not found." };

  await recordActivity(
    user.id,
    `chat_conversation.${status}`,
    "chat_conversation",
    conversation.id,
    `Marked chat conversation ${status}`,
  );

  revalidatePath("/dashboard/chat-conversations");
  revalidatePath(`/dashboard/chat-conversations/${conversation.id}`);

  return { ok: true as const };
}
