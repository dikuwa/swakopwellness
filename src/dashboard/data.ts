import { and, asc, count, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookingAnswers, bookingStatusHistory, bookings, chatConversations, chatMessages, chatToolEvents, clients, followUps, invoiceLineItems, invoices, payments, receipts, serviceQuestions, services, users } from "@/db/schema";

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

export async function getDashboardChatConversations() {
  const db = getDb();
  return db
    .select({
      id: chatConversations.id,
      status: chatConversations.status,
      createdAt: chatConversations.createdAt,
      updatedAt: chatConversations.updatedAt,
      bookingId: bookings.id,
      bookingReference: bookings.reference,
      clientId: clients.id,
      clientName: clients.fullName,
    })
    .from(chatConversations)
    .leftJoin(bookings, eq(chatConversations.bookingId, bookings.id))
    .leftJoin(clients, eq(chatConversations.clientId, clients.id))
    .orderBy(desc(chatConversations.updatedAt))
    .limit(100);
}

export async function getDashboardReports() {
  const db = getDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [bookingCount] = await db.select({ value: count() }).from(bookings);
  const [clientCount] = await db.select({ value: count() }).from(clients);
  const [followUpsDue] = await db
    .select({ value: count() })
    .from(followUps)
    .where(and(eq(followUps.status, "pending"), sql`${followUps.dueAt} < ${new Date(todayStart.getTime() + 86400000)}`));
  const [outstandingInvoices] = await db
    .select({ value: sql<number>`coalesce(sum(${invoices.balanceCents}), 0)::int` })
    .from(invoices)
    .where(inArray(invoices.status, ["issued", "partially_paid", "overdue"]));
  const [paymentsLast30] = await db
    .select({ value: sql<number>`coalesce(sum(${payments.amountCents}), 0)::int` })
    .from(payments)
    .where(and(gte(payments.paymentDate, thirtyDaysAgo), isNull(payments.voidedAt)));
  const [receiptsLast30] = await db
    .select({ value: sql<number>`coalesce(sum(${receipts.amountCents}), 0)::int` })
    .from(receipts)
    .where(and(gte(receipts.paymentDate, thirtyDaysAgo), isNull(receipts.voidedAt)));

  const bookingsByStatus = await db
    .select({ status: bookings.status, value: count() })
    .from(bookings)
    .groupBy(bookings.status)
    .orderBy(bookings.status);
  const bookingsBySource = await db
    .select({ source: bookings.source, value: count() })
    .from(bookings)
    .groupBy(bookings.source)
    .orderBy(bookings.source);
  const invoiceBalancesByStatus = await db
    .select({ status: invoices.status, count: count(), balanceCents: sql<number>`coalesce(sum(${invoices.balanceCents}), 0)::int` })
    .from(invoices)
    .groupBy(invoices.status)
    .orderBy(invoices.status);
  const paymentsByMethod = await db
    .select({ method: payments.method, value: sql<number>`coalesce(sum(${payments.amountCents}), 0)::int`, count: count() })
    .from(payments)
    .where(isNull(payments.voidedAt))
    .groupBy(payments.method)
    .orderBy(payments.method);

  return {
    cards: {
      bookingCount: bookingCount.value,
      clientCount: clientCount.value,
      followUpsDue: followUpsDue.value,
      outstandingInvoiceCents: outstandingInvoices.value,
      paymentsLast30Cents: paymentsLast30.value,
      receiptsLast30Cents: receiptsLast30.value,
    },
    bookingsByStatus,
    bookingsBySource,
    invoiceBalancesByStatus,
    paymentsByMethod,
  };
}

export async function getDashboardChatConversationById(id: string) {
  const db = getDb();
  const [conversation] = await db
    .select({
      id: chatConversations.id,
      status: chatConversations.status,
      createdAt: chatConversations.createdAt,
      updatedAt: chatConversations.updatedAt,
      bookingId: bookings.id,
      bookingReference: bookings.reference,
      bookingStatus: bookings.status,
      clientId: clients.id,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      clientEmail: clients.email,
    })
    .from(chatConversations)
    .leftJoin(bookings, eq(chatConversations.bookingId, bookings.id))
    .leftJoin(clients, eq(chatConversations.clientId, clients.id))
    .where(eq(chatConversations.id, id))
    .limit(1);

  if (!conversation) return null;

  const messages = await db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, id))
    .orderBy(asc(chatMessages.createdAt));

  const toolEvents = await db
    .select({
      id: chatToolEvents.id,
      toolName: chatToolEvents.toolName,
      status: chatToolEvents.status,
      summary: chatToolEvents.summary,
      createdAt: chatToolEvents.createdAt,
    })
    .from(chatToolEvents)
    .where(eq(chatToolEvents.conversationId, id))
    .orderBy(asc(chatToolEvents.createdAt));

  return { ...conversation, messages, toolEvents };
}

export async function getDashboardBookingById(id: string, includeSuitability: boolean) {
  const db = getDb();
  const [booking] = await db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      serviceId: bookings.serviceId,
      serviceName: bookings.serviceName,
      servicePriceCents: bookings.servicePriceCents,
      serviceDurationMinutes: bookings.serviceDurationMinutes,
      preferredAt: bookings.preferredAt,
      alternativeAt: bookings.alternativeAt,
      status: bookings.status,
      source: bookings.source,
      preferredContactMethod: bookings.preferredContactMethod,
      clientType: bookings.clientType,
      note: bookings.note,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      clientId: clients.id,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      clientWhatsapp: clients.whatsappNumber,
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!booking) return null;

  const history = await db
    .select({
      id: bookingStatusHistory.id,
      fromStatus: bookingStatusHistory.fromStatus,
      toStatus: bookingStatusHistory.toStatus,
      note: bookingStatusHistory.note,
      createdAt: bookingStatusHistory.createdAt,
      actorName: users.name,
    })
    .from(bookingStatusHistory)
    .leftJoin(users, eq(bookingStatusHistory.actorUserId, users.id))
    .where(eq(bookingStatusHistory.bookingId, id))
    .orderBy(desc(bookingStatusHistory.createdAt));

  const answers = includeSuitability
    ? await db
        .select({
          id: bookingAnswers.id,
          questionText: bookingAnswers.questionText,
          answer: bookingAnswers.answer,
          flagged: bookingAnswers.flagged,
          createdAt: bookingAnswers.createdAt,
        })
        .from(bookingAnswers)
        .where(eq(bookingAnswers.bookingId, id))
        .orderBy(asc(bookingAnswers.createdAt))
    : [];

  return { ...booking, history, answers };
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

export async function getFollowUpBookingOptions() {
  const db = getDb();
  return db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      clientId: bookings.clientId,
      clientName: clients.fullName,
      serviceName: bookings.serviceName,
      preferredAt: bookings.preferredAt,
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .orderBy(desc(bookings.createdAt))
    .limit(100);
}

export async function getBookableServicesForManualUse() {
  const db = getDb();
  return db.select({ id: services.id, name: services.name, priceCents: services.priceCents }).from(services).where(eq(services.active, true)).orderBy(asc(services.sortOrder));
}

export async function getActiveSuitabilityQuestionsForDashboard() {
  const db = getDb();
  return db.select({ id: serviceQuestions.id, question: serviceQuestions.question }).from(serviceQuestions).where(and(eq(serviceQuestions.active, true), isNull(serviceQuestions.serviceId))).orderBy(asc(serviceQuestions.sortOrder));
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
