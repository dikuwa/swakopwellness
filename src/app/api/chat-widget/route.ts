import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { chatConversations, chatMessages } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contact, contactType, message } = body;

    if (!name || !contact || !message) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const db = getDb();

    const [conversation] = await db
      .insert(chatConversations)
      .values({ status: "new" })
      .returning({ id: chatConversations.id });

    await db.insert(chatMessages).values([
      {
        conversationId: conversation.id,
        role: "user",
        content: `Name: ${name}\nContact (${contactType}): ${contact}\n\nConversation:\n${message}`,
      },
      {
        conversationId: conversation.id,
        role: "assistant",
        content: `Thanks, ${name}. Your message has been received and a team member will follow up via ${contactType}.`,
      },
    ]);

    return NextResponse.json({ ok: true, conversationId: conversation.id });
  } catch (e) {
    console.error("Chat widget submission error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send message." },
      { status: 500 },
    );
  }
}
