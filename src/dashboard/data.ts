import { asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookings, clients, followUps, invoiceLineItems, invoices, payments, receipts, services } from "@/db/schema";

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

export async function getClients() {
  const db = getDb();
  return db.select().from(clients).orderBy(desc(clients.createdAt)).limit(100);
}

export async function getClientById(id: string) {
  const db = getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return client ?? null;
}

export async function getInvoices() {
  const db = getDb();
  return db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      clientName: clients.fullName,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      totalCents: invoices.totalCents,
      amountPaidCents: invoices.amountPaidCents,
      balanceCents: invoices.balanceCents,
      status: invoices.status,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt))
    .limit(100);
}

export async function getInvoiceById(id: string) {
  const db = getDb();
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);
  if (!invoice) return null;
  const items = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, id)).orderBy(asc(invoiceLineItems.sortOrder));
  return { ...invoice, lineItems: items };
}

export async function getReceipts() {
  const db = getDb();
  return db
    .select({
      id: receipts.id,
      receiptNumber: receipts.receiptNumber,
      clientName: clients.fullName,
      amountCents: receipts.amountCents,
      paymentDate: receipts.paymentDate,
      paymentMethod: receipts.paymentMethod,
      voidedAt: receipts.voidedAt,
    })
    .from(receipts)
    .innerJoin(clients, eq(receipts.clientId, clients.id))
    .orderBy(desc(receipts.createdAt))
    .limit(100);
}

export async function getPayments() {
  const db = getDb();
  return db
    .select({
      id: payments.id,
      clientName: clients.fullName,
      amountCents: payments.amountCents,
      paymentDate: payments.paymentDate,
      method: payments.method,
      reference: payments.reference,
    })
    .from(payments)
    .innerJoin(clients, eq(payments.clientId, clients.id))
    .orderBy(desc(payments.createdAt))
    .limit(100);
}

