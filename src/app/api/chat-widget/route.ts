import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { createBookingRequest, type CreateBookingResult } from "@/booking/create";
import { getDb } from "@/db/client";
import { businessSettings, chatConversations, chatMessages, chatToolEvents, services } from "@/db/schema";
import { approvedBookingSummary } from "@/chatbot/safety";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function validPhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return /^[+\d\s().-]+$/.test(trimmed) && digits.length >= 7 && digits.length <= 15 && !/^(\d)\1+$/.test(digits);
}

function formatMoney(cents: number, symbol = "N$") {
  return `${symbol}${(cents / 100).toLocaleString("en-NA", { maximumFractionDigits: 0 })}`;
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
  if (!validPhone(phone)) return { ok: false, message: "Please enter a valid phone number. You can use 081..., +264..., 264..., or a landline number." } satisfies CreateBookingResult;

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

function parseTranscript(body: Record<string, unknown>) {
  const transcript = body.transcript;
  if (Array.isArray(transcript)) {
    return transcript
      .map((message) => {
        if (!message || typeof message !== "object") return null;
        const role = "role" in message ? String(message.role) : "";
        const content = "content" in message ? String(message.content ?? "").trim() : "";
        if (!["assistant", "user"].includes(role) || !content) return null;
        return { role, content };
      })
      .filter((message): message is { role: string; content: string } => Boolean(message));
  }

  const legacy = String(body.message ?? "").trim();
  if (!legacy) return [];

  const messages: { role: string; content: string }[] = [];
  for (const line of legacy.split("\n")) {
    const match = /^(assistant|user):\s*(.*)$/i.exec(line);
    if (match) {
      messages.push({ role: match[1].toLowerCase(), content: match[2].trim() });
    } else if (messages.length > 0) {
      messages[messages.length - 1].content += `\n${line}`;
    }
  }
  return messages.filter((message) => message.content.trim());
}

export async function GET() {
  try {
    const db = getDb();
    const [business] = await db.select({ currencySymbol: businessSettings.currencySymbol }).from(businessSettings).limit(1);
    const currencySymbol = business?.currencySymbol ?? "N$";
    const bookableServices = await db
      .select({
        name: services.name,
        slug: services.slug,
        priceCents: services.priceCents,
        durationMinutes: services.durationMinutes,
      })
      .from(services)
      .where(and(eq(services.active, true), eq(services.publicVisible, true), eq(services.bookingEnabled, true)))
      .orderBy(asc(services.sortOrder), asc(services.name));

    return NextResponse.json({
      services: bookableServices.map((service) => ({
        name: service.name,
        slug: service.slug,
        price: formatMoney(service.priceCents, currencySymbol),
        duration: `${service.durationMinutes ?? 30} minutes`,
      })),
    });
  } catch (e) {
    console.error("Chat widget data error:", e);
    return NextResponse.json({ services: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.type === "booking") {
      const db = getDb();
      const result = await createWidgetBooking(body);
      const submittedMessages = parseTranscript(body);

      const [conversation] = await db
        .insert(chatConversations)
        .values({
          status: result.ok ? "booking_requested" : "booking_failed",
          bookingId: result.ok ? result.bookingId : null,
          clientId: result.ok ? result.clientId : null,
        })
        .returning({ id: chatConversations.id });

      await db.insert(chatMessages).values([
        ...(submittedMessages.length > 0
          ? submittedMessages.map((message) => ({
              conversationId: conversation.id,
              role: message.role,
              content: message.content,
            }))
          : [{
              conversationId: conversation.id,
              role: "user",
              content: "Submitted guided chat booking request.",
            }]),
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
