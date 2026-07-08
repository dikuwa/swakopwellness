import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createBookingRequest, type CreateBookingResult } from "@/booking/create";
import { getDb } from "@/db/client";
import { chatConversations, chatMessages, chatToolEvents, services } from "@/db/schema";
import { approvedBookingSummary } from "@/chatbot/safety";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value: string) {
  return /^[0-9+\s()-]{7,}$/.test(value) && /\d{7,}/.test(value.replace(/\D/g, ""));
}

async function createWidgetBooking(body: Record<string, unknown>) {
  const db = getDb();
  const serviceSlug = String(body.serviceSlug ?? "");

  const [service] = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(and(eq(services.slug, serviceSlug), eq(services.active, true), eq(services.publicVisible, true), eq(services.bookingEnabled, true)))
    .limit(1);

  if (!service) {
    return { ok: false, message: "That service is not currently available for online booking. Please choose another service or ask our team to help." } satisfies CreateBookingResult;
  }

  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();

  if (!fullName) return { ok: false, message: "Please enter your full name." } satisfies CreateBookingResult;
  if (!validEmail(email)) return { ok: false, message: "Please enter a valid email address." } satisfies CreateBookingResult;
  if (!validPhone(phone)) return { ok: false, message: "Please enter a numeric phone number." } satisfies CreateBookingResult;

  const result = await createBookingRequest(
    {
      serviceId: service.id,
      preferredDate: String(body.preferredDate ?? ""),
      preferredTime: String(body.preferredTime ?? ""),
      fullName,
      email,
      phone,
      whatsappNumber: "",
      clientType: "new",
      preferredContactMethod: "phone",
      note: String(body.note ?? ""),
      answers: {},
    },
    "chatbot",
  );

  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.type === "booking") {
      const db = getDb();
      const result = await createWidgetBooking(body);

      const [conversation] = await db
        .insert(chatConversations)
        .values({
          status: result.ok ? "booking_requested" : "booking_failed",
          bookingId: result.ok ? result.bookingId : null,
          clientId: result.ok ? result.clientId : null,
        })
        .returning({ id: chatConversations.id });

      await db.insert(chatMessages).values([
        {
          conversationId: conversation.id,
          role: "user",
          content: String(body.message ?? "Submitted guided chat booking request."),
        },
        {
          conversationId: conversation.id,
          role: "assistant",
          content: result.ok ? approvedBookingSummary(result.reference, result.status) : result.message,
        },
      ]);

      await db.insert(chatToolEvents).values({
        conversationId: conversation.id,
        toolName: "createBookingRequest",
        status: result.ok ? "success" : "error",
        summary: result.ok ? `Created booking request ${result.reference}` : result.message,
      });

      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true, conversationId: conversation.id, reference: result.reference, status: result.status });
    }

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
