import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
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

const serviceAliases: Record<string, string[]> = {
  meridians: ["meridians", "meridian"],
  "basic-health-scan": ["basic-health-scan", "basic health scan", "basic scan"],
  "3d-scan": ["3d-scan", "3d scan", "3-d scan", "3d"],
  "food-tolerance-and-nutrition-testing": [
    "food-tolerance-and-nutrition-testing",
    "food tolerance and nutrition testing",
    "food-tolerance-nutrition-testing",
    "food tolerance & nutrition testing",
    "food tolerance nutrition testing",
  ],
  "frequency-therapy": ["frequency-therapy", "frequency therapy"],
};

function normaliseServiceKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createWidgetBooking(body: Record<string, unknown>) {
  const db = getDb();
  const serviceSlug = normaliseServiceKey(String(body.serviceSlug ?? ""));
  const serviceName = normaliseServiceKey(String(body.serviceName ?? ""));
  const requestedAliases = [...new Set([serviceSlug, serviceName, ...(serviceAliases[serviceSlug] ?? [])].filter(Boolean).map(normaliseServiceKey))];

  const bookableServices = await db
    .select({ id: services.id, name: services.name, slug: services.slug })
    .from(services)
    .where(and(eq(services.active, true), eq(services.publicVisible, true), eq(services.bookingEnabled, true)));

  const service =
    bookableServices.find((item) => requestedAliases.includes(normaliseServiceKey(item.slug))) ??
    bookableServices.find((item) => requestedAliases.includes(normaliseServiceKey(item.name))) ??
    bookableServices.find((item) => requestedAliases.some((alias) => normaliseServiceKey(item.slug).includes(alias) || normaliseServiceKey(item.name).includes(alias)));

  if (!service) {
    const [fallbackService] = await db
      .select({ id: services.id, name: services.name })
      .from(services)
      .where(
        and(
          inArray(services.slug, ["basic-health-scan", "frequency-therapy", "meridians", "food-tolerance-and-nutrition-testing"]),
          eq(services.active, true),
          eq(services.publicVisible, true),
          eq(services.bookingEnabled, true),
        ),
      )
      .limit(1);

    if (!fallbackService) {
      return { ok: false, message: "That service is not currently available for online booking. Please choose another service or ask our team to help." } satisfies CreateBookingResult;
    }

    return saveWidgetBooking(body, fallbackService);
  }

  return saveWidgetBooking(body, service);
}

async function saveWidgetBooking(body: Record<string, unknown>, service: { id: string; name: string }) {
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();

  if (!fullName) return { ok: false, message: "Please enter your full name." } satisfies CreateBookingResult;
  if (!validEmail(email)) return { ok: false, message: "Please enter a valid email address." } satisfies CreateBookingResult;
  if (!validPhone(phone)) return { ok: false, message: "Please enter a numeric phone number." } satisfies CreateBookingResult;

  const note = [String(body.note ?? "").trim(), body.serviceName && body.serviceName !== service.name ? `Requested service from chat: ${body.serviceName}` : ""]
    .filter(Boolean)
    .join("\n");

  return await createBookingRequest(
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
      note,
      answers: {},
    },
    "chatbot",
  );
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
