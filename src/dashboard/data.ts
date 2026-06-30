import { asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookings, clients, followUps, services } from "@/db/schema";

export async function getDashboardBookings() {
  const db = getDb();
  return db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      serviceName: bookings.serviceName,
      preferredAt: bookings.preferredAt,
      status: bookings.status,
      source: bookings.source,
      clientName: clients.fullName,
      clientPhone: clients.phone,
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .orderBy(desc(bookings.createdAt))
    .limit(50);
}

export async function getUpcomingCalendarBookings() {
  const db = getDb();
  return db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      serviceName: bookings.serviceName,
      preferredAt: bookings.preferredAt,
      status: bookings.status,
      clientName: clients.fullName,
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(inArray(bookings.status, ["new_request", "requires_review", "contacting_client", "awaiting_client_response", "confirmed", "rescheduled"]))
    .orderBy(asc(bookings.preferredAt))
    .limit(80);
}

export async function getFollowUps() {
  const db = getDb();
  return db
    .select({
      id: followUps.id,
      dueAt: followUps.dueAt,
      method: followUps.method,
      status: followUps.status,
      internalNote: followUps.internalNote,
      clientName: clients.fullName,
      bookingReference: bookings.reference,
    })
    .from(followUps)
    .innerJoin(clients, eq(followUps.clientId, clients.id))
    .leftJoin(bookings, eq(followUps.bookingId, bookings.id))
    .orderBy(asc(followUps.dueAt))
    .limit(80);
}

export async function getBookableServicesForManualUse() {
  const db = getDb();
  return db.select({ id: services.id, name: services.name }).from(services).where(eq(services.active, true)).orderBy(asc(services.sortOrder));
}
