import { getDb } from "@/db/client";
import { bookingAnswers, bookingRules, bookings, bookingStatusHistory, clients, communicationSettings, serviceQuestions, services } from "@/db/schema";
import { sendBookingConfirmation, sendBookingNotificationToStaff } from "@/email/send";
import { notifyStaff } from "@/notifications/create";
import { and, desc, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import { normalizeEmail, normalizePhone } from "./contact";
import { createBookingReference } from "./reference";
import { getInitialBookingStatus } from "./status";
import { bookingRequestSchema, hasAtLeastOneContact, isContactMethodAvailable, parseDateTime, type BookingRequestInput } from "./validation";

export type CreateBookingResult =
  | { ok: true; reference: string; status: string; bookingId?: string; clientId?: string }
  | { ok: false; message: string };

type BookingSource = "website_form" | "chatbot" | "manual_admin";

export async function createBookingRequest(input: unknown, source: BookingSource = "website_form"): Promise<CreateBookingResult> {
  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check the form fields and try again." };

  const data = parsed.data;
  const preferredAt = parseDateTime(data.preferredDate, data.preferredTime);
  const alternativeAt = data.alternativeDate && data.alternativeTime ? parseDateTime(data.alternativeDate, data.alternativeTime) : null;

  if (!preferredAt) return { ok: false, message: "Choose a valid preferred date and time." };
  if (!hasAtLeastOneContact(data)) return { ok: false, message: "Provide at least one contact method." };

  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [communication] = await tx.select().from(communicationSettings).limit(1);
    if (!communication) return { ok: false, message: "Communication settings are not configured." } satisfies CreateBookingResult;
    if (!isContactMethodAvailable(data.preferredContactMethod, communication)) {
      return { ok: false, message: "Choose an enabled contact method." } satisfies CreateBookingResult;
    }

    const [rules] = await tx.select().from(bookingRules).limit(1);
    const [service] = await tx
      .select()
      .from(services)
      .where(and(eq(services.id, data.serviceId), eq(services.active, true)))
      .limit(1);

    if (!service) return { ok: false, message: "Choose an available service." } satisfies CreateBookingResult;
    if (source !== "manual_admin" && (!service.publicVisible || !service.bookingEnabled)) {
      return { ok: false, message: "Choose an available service." } satisfies CreateBookingResult;
    }

    const normalizedPhone = normalizePhone(data.phone);
    const normalizedEmail = normalizeEmail(data.email);
    const normalizedWhatsapp = normalizePhone(data.whatsappNumber);

    const duplicateSince = new Date(Date.now() - (rules?.duplicateWindowMinutes ?? 30) * 60 * 1000);
    const duplicateConditions = [
      normalizedPhone ? eq(clients.normalizedPhone, normalizedPhone) : undefined,
      normalizedEmail ? eq(clients.normalizedEmail, normalizedEmail) : undefined,
      normalizedWhatsapp ? eq(clients.normalizedWhatsapp, normalizedWhatsapp) : undefined,
    ].filter((condition) => condition !== undefined);

    // Check for duplicate submissions
    if (duplicateConditions.length > 0) {
      const [duplicate] = await tx
        .select({ reference: bookings.reference })
        .from(bookings)
        .innerJoin(clients, eq(bookings.clientId, clients.id))
        .where(and(eq(bookings.serviceId, service.id), eq(bookings.preferredAt, preferredAt), gte(bookings.createdAt, duplicateSince), or(...duplicateConditions)))
        .orderBy(desc(bookings.createdAt))
        .limit(1);

      if (duplicate) return { ok: true, reference: duplicate.reference, status: "duplicate_returned" } satisfies CreateBookingResult;
    }

    // Conflict detection: check for overlapping time ranges across all services
    // (single-practitioner clinic — any booking at the same time conflicts)
    const serviceDuration = service.durationMinutes ?? 30;
    const conflictStatuses = ["new_request", "requires_review", "contacting_client", "awaiting_client_response", "confirmed", "rescheduled"];
    const newEnd = new Date(preferredAt.getTime() + serviceDuration * 60 * 1000);

    const [conflict] = await tx
      .select({ reference: bookings.reference, status: bookings.status })
      .from(bookings)
      .where(
        and(
          or(...conflictStatuses.map((s) => eq(bookings.status, s))),
          // existing.start < new.end
          lt(bookings.preferredAt, newEnd),
          // new.start < existing.end  (using coalesce for null duration -> 30 min default)
          sql`${preferredAt.toISOString()} < ${bookings.preferredAt} + coalesce(${bookings.serviceDurationMinutes}, 30) * interval '1 minute'`,
        ),
      )
      .limit(1);

    if (conflict) {
      if (source === "manual_admin") {
        return { ok: false, message: `Time conflict: there is already a ${conflict.status.replaceAll("_", " ")} booking (${conflict.reference}) overlapping with this time slot.` } satisfies CreateBookingResult;
      }
      // For public bookings, proceed but mark for review so staff can handle the conflict
    }

    const [existingClient] = duplicateConditions.length > 0
      ? await tx.select().from(clients).where(or(...duplicateConditions)).orderBy(desc(clients.updatedAt)).limit(1)
      : [];

    const [client] = existingClient
      ? await tx
          .update(clients)
          .set({
            fullName: data.fullName,
            phone: data.phone || existingClient.phone,
            normalizedPhone: normalizedPhone || existingClient.normalizedPhone,
            email: data.email || existingClient.email,
            normalizedEmail: normalizedEmail || existingClient.normalizedEmail,
            whatsappNumber: data.whatsappNumber || existingClient.whatsappNumber,
            normalizedWhatsapp: normalizedWhatsapp || existingClient.normalizedWhatsapp,
            preferredContactMethod: data.preferredContactMethod,
            updatedAt: new Date(),
          })
          .where(eq(clients.id, existingClient.id))
          .returning({ id: clients.id })
      : await tx
          .insert(clients)
          .values({
            fullName: data.fullName,
            phone: data.phone || null,
            normalizedPhone,
            email: data.email || null,
            normalizedEmail,
            whatsappNumber: data.whatsappNumber || null,
            normalizedWhatsapp,
            preferredContactMethod: data.preferredContactMethod,
          })
          .returning({ id: clients.id });

    const questions = await tx
      .select()
      .from(serviceQuestions)
      .where(and(eq(serviceQuestions.active, true), or(isNull(serviceQuestions.serviceId), eq(serviceQuestions.serviceId, service.id))));
    const answers = questions.map((question) => {
      const answer = data.answers[question.id] ?? "no";
      return {
        questionId: question.id,
        questionText: question.question,
        answer,
        flagged: answer === question.flaggedAnswer,
      };
    });
    const hasFlaggedSuitability = answers.some((answer) => answer.flagged);
    const status = getInitialBookingStatus(hasFlaggedSuitability);
    let reference = createBookingReference();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await tx.select({ id: bookings.id }).from(bookings).where(eq(bookings.reference, reference)).limit(1);
      if (existing.length === 0) break;
      reference = createBookingReference();
    }

    const [booking] = await tx
      .insert(bookings)
      .values({
        reference,
        clientId: client.id,
        serviceId: service.id,
        serviceName: service.name,
        servicePriceCents: service.priceCents,
        serviceDurationMinutes: service.durationMinutes,
        preferredAt,
        alternativeAt,
        status,
        source,
        preferredContactMethod: data.preferredContactMethod,
        clientType: data.clientType,
        note: data.note || null,
      })
      .returning({ id: bookings.id, reference: bookings.reference });

    if (answers.length > 0) {
      await tx.insert(bookingAnswers).values(answers.map((answer) => ({ ...answer, bookingId: booking.id })));
    }

    await tx.insert(bookingStatusHistory).values({ bookingId: booking.id, toStatus: status, note: "Booking request created." });
    await tx.update(clients).set({ lastBookingAt: new Date(), updatedAt: new Date() }).where(eq(clients.id, client.id));

    return { ok: true as const, reference: booking.reference, status, bookingId: booking.id, clientId: client.id };
  });

  if (result.ok && result.status !== "duplicate_returned") {
    const sourceLabel = source === "manual_admin" ? "Admin" : source === "chatbot" ? "Chatbot" : "Website";
    const needsReview = result.status === "requires_review";
    await notifyStaff("booking.created", `New booking ${result.reference}`, `${sourceLabel} booking request for ${data.fullName} (${result.reference})${needsReview ? " — requires review" : ""}`, "booking", result.bookingId);
    if (result.bookingId) {
      sendBookingNotificationToStaff(result.bookingId).catch(console.error);
      sendBookingConfirmation(result.bookingId).catch(console.error);
    }
  }
  return result;
}

export function formDataToBookingInput(formData: FormData): BookingRequestInput {
  const answers: Record<string, "yes" | "no"> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("answer:") && (value === "yes" || value === "no")) {
      answers[key.slice("answer:".length)] = value;
    }
  }

  return {
    serviceId: String(formData.get("serviceId") ?? ""),
    preferredDate: String(formData.get("preferredDate") ?? ""),
    preferredTime: String(formData.get("preferredTime") ?? ""),
    alternativeDate: String(formData.get("alternativeDate") ?? ""),
    alternativeTime: String(formData.get("alternativeTime") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
    clientType: formData.get("clientType") === "returning" ? "returning" : "new",
    preferredContactMethod: formData.get("preferredContactMethod") === "email" ? "email" : formData.get("preferredContactMethod") === "whatsapp" ? "whatsapp" : "phone",
    note: String(formData.get("note") ?? ""),
    answers,
  };
}
