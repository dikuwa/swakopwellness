"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordActivity } from "@/activity-log/record";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { chatConversations, chatMessages } from "@/db/schema";

const chatStatuses = ["new", "bot_active", "human_active", "closed", "open", "booking_requested", "booking_failed", "booking_started"] as const;

function canonicalStatus(status: string) {
  if (status === "open" || status === "booking_requested" || status === "booking_started") return "bot_active";
  if (status === "booking_failed") return "new";
  return status;
}

export async function updateChatConversationStatus(formData: FormData) {
  const user = await requirePermission("bookings:update");
  const conversationId = formData.get("conversationId") as string;
  const status = formData.get("status") as string;

  const nextStatus = canonicalStatus(status);
  if (!conversationId || !chatStatuses.includes(status as (typeof chatStatuses)[number]) || !["new", "bot_active", "human_active", "closed"].includes(nextStatus)) {
    return { ok: false as const, error: "Invalid conversation status update." };
  }

  const db = getDb();
  const [conversation] = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(chatConversations)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId))
      .returning({ id: chatConversations.id, status: chatConversations.status });

    if (!updated) return [];

    if (nextStatus === "human_active") {
      await tx.insert(chatMessages).values({
        conversationId,
        role: "assistant",
        content: "A member of our team has joined the chat to assist you directly.",
      });
    } else if (nextStatus === "bot_active") {
      await tx.insert(chatMessages).values({
        conversationId,
        role: "assistant",
        content: "You’re now chatting with our assistant again.",
      });
    }

    return [updated];
  });

  if (!conversation) return { ok: false as const, error: "Conversation not found." };

  await recordActivity(
    user.id,
    `chat_conversation.${nextStatus}`,
    "chat_conversation",
    conversation.id,
    `Marked chat conversation ${nextStatus.replaceAll("_", " ")}`,
  );

  revalidatePath("/dashboard/chat-conversations");
  revalidatePath(`/dashboard/chat-conversations/${conversation.id}`);

  return { ok: true as const };
}

export async function sendChatConversationReply(formData: FormData) {
  const user = await requirePermission("bookings:update");
  const conversationId = String(formData.get("conversationId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!conversationId || !content) {
    return { ok: false as const, error: "Enter a reply before sending." };
  }
  if (content.length > 2000) {
    return { ok: false as const, error: "Reply is too long. Keep it under 2,000 characters." };
  }

  const db = getDb();
  const [conversation] = await db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: chatConversations.id }).from(chatConversations).where(eq(chatConversations.id, conversationId)).limit(1);
    if (!existing) return [];

    await tx.insert(chatMessages).values({
      conversationId,
      role: "assistant",
      content,
    });

    const [updated] = await tx
      .update(chatConversations)
      .set({ status: "human_active", updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId))
      .returning({ id: chatConversations.id });

    return [updated];
  });

  if (!conversation) return { ok: false as const, error: "Conversation not found." };

  await recordActivity(
    user.id,
    "chat_conversation.reply",
    "chat_conversation",
    conversation.id,
    "Sent a manual chat reply",
  );

  revalidatePath("/dashboard/chat-conversations");
  revalidatePath(`/dashboard/chat-conversations/${conversation.id}`);

  return { ok: true as const };
}
