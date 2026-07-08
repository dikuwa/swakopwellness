import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { recordActivity } from "@/activity-log/record";
import { getDb } from "@/db/client";
import {
  bookings,
  clients,
  documentLineItems,
  documents,
  invoiceLineItems,
  invoices,
  receiptLineItems,
  receipts,
  quotationLineItems,
  quotations,
} from "@/db/schema";
import { createInvoice } from "@/invoices/create";
import { recordPayment } from "@/payments/record";
import { createQuotation } from "@/quotations/create";

export type UnifiedDocumentType = "quotation" | "invoice" | "receipt";

export interface UnifiedLineItemInput {
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents?: number;
}

export interface CreateUnifiedDocumentInput {
  type: UnifiedDocumentType;
  bookingId?: string | null;
  clientId?: string | null;
  issueDate: Date;
  validUntil?: Date | null;
  dueDate?: Date | null;
  lineItems: UnifiedLineItemInput[];
  manualEntry?: boolean;
  createdByUserId: string;
}

export type UnifiedDocumentResult =
  | { ok: true; id: string; documentNumber: string; type: UnifiedDocumentType; totalCents: number }
  | { ok: false; message: string };

export function calculateUnifiedTotals(lineItems: UnifiedLineItemInput[]) {
  const subtotalCents = lineItems.reduce((sum, item) => {
    const gross = item.quantity * item.unitPriceCents;
    return sum + Math.max(0, gross - (item.discountCents ?? 0));
  }, 0);
  return {
    subtotalCents,
    discountCents: 0,
    taxCents: 0,
    totalCents: subtotalCents,
  };
}

export function canApplyPayment(amountCents: number, outstandingCents: number) {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return { ok: false as const, message: "Payment amount must be greater than zero." };
  if (amountCents > outstandingCents) return { ok: false as const, message: "Payment cannot exceed the outstanding invoice balance." };
  return { ok: true as const };
}

export async function getActiveBookingOptions() {
  const db = getDb();
  return db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      clientId: clients.id,
      clientName: clients.fullName,
      serviceId: bookings.serviceId,
      serviceName: bookings.serviceName,
      servicePriceCents: bookings.servicePriceCents,
      preferredAt: bookings.preferredAt,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(sql`${bookings.status} NOT IN ('cancelled', 'completed', 'no_show')`)
    .orderBy(desc(bookings.createdAt))
    .limit(150);
}

export async function getBookingCharges(bookingId: string) {
  const db = getDb();
  const [booking] = await db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      clientId: clients.id,
      clientName: clients.fullName,
      serviceId: bookings.serviceId,
      serviceName: bookings.serviceName,
      servicePriceCents: bookings.servicePriceCents,
      preferredAt: bookings.preferredAt,
    })
    .from(bookings)
    .innerJoin(clients, eq(bookings.clientId, clients.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return null;

  return {
    booking,
    lineItems: [
      {
        serviceId: booking.serviceId,
        description: booking.serviceName,
        quantity: 1,
        unitPriceCents: booking.servicePriceCents,
        discountCents: 0,
      },
    ],
  };
}

async function mirrorInvoiceDocument(invoiceId: string, manualEntry: boolean, createdByUserId: string) {
  const db = getDb();
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!invoice) return null;
  const items = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoice.id)).orderBy(asc(invoiceLineItems.sortOrder));

  const [doc] = await db
    .insert(documents)
    .values({
      documentNumber: invoice.invoiceNumber,
      type: "invoice",
      clientId: invoice.clientId,
      bookingId: invoice.bookingId,
      sourceInvoiceId: invoice.id,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotalCents: invoice.subtotalCents,
      discountCents: invoice.discountCents,
      taxCents: invoice.taxCents,
      totalCents: invoice.totalCents,
      amountPaidCents: invoice.amountPaidCents,
      balanceCents: invoice.balanceCents,
      status: invoice.status,
      manualEntry,
      createdByUserId,
    })
    .onConflictDoNothing({ target: documents.documentNumber })
    .returning();

  if (doc && items.length > 0) {
    await db.insert(documentLineItems).values(
      items.map((item) => ({
        documentId: doc.id,
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        discountCents: item.discountCents,
        sortOrder: item.sortOrder,
      })),
    );
  }

  return doc ?? (await db.select().from(documents).where(eq(documents.documentNumber, invoice.invoiceNumber)).limit(1))[0] ?? null;
}

export async function mirrorReceiptDocument(receiptId: string, manualEntry: boolean, createdByUserId: string) {
  const db = getDb();
  const [receipt] = await db.select().from(receipts).where(eq(receipts.id, receiptId)).limit(1);
  if (!receipt) return null;
  const items = await db.select().from(receiptLineItems).where(eq(receiptLineItems.receiptId, receipt.id)).orderBy(asc(receiptLineItems.sortOrder));

  const [doc] = await db
    .insert(documents)
    .values({
      documentNumber: receipt.receiptNumber,
      type: "receipt",
      clientId: receipt.clientId,
      bookingId: receipt.bookingId,
      sourceReceiptId: receipt.id,
      sourceInvoiceId: receipt.invoiceId,
      issueDate: receipt.paymentDate,
      subtotalCents: receipt.amountCents,
      totalCents: receipt.amountCents,
      amountPaidCents: receipt.amountCents,
      balanceCents: 0,
      status: receipt.voidedAt ? "voided" : "active",
      manualEntry,
      createdByUserId,
    })
    .onConflictDoNothing({ target: documents.documentNumber })
    .returning();

  if (doc && items.length > 0) {
    await db.insert(documentLineItems).values(
      items.map((item) => ({
        documentId: doc.id,
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        discountCents: item.discountCents,
        sortOrder: item.sortOrder,
      })),
    );
  }

  return doc ?? (await db.select().from(documents).where(eq(documents.documentNumber, receipt.receiptNumber)).limit(1))[0] ?? null;
}

async function mirrorQuotationDocument(quotationId: string, manualEntry: boolean, createdByUserId: string) {
  const db = getDb();
  const [quotation] = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
  if (!quotation) return null;
  const items = await db.select().from(quotationLineItems).where(eq(quotationLineItems.quotationId, quotation.id)).orderBy(asc(quotationLineItems.sortOrder));

  const [doc] = await db
    .insert(documents)
    .values({
      documentNumber: quotation.quotationNumber,
      type: "quotation",
      clientId: quotation.clientId,
      bookingId: quotation.bookingId,
      sourceQuotationId: quotation.id,
      issueDate: quotation.issueDate,
      validUntil: quotation.validUntil,
      subtotalCents: quotation.subtotalCents,
      discountCents: quotation.discountCents,
      totalCents: quotation.totalCents,
      status: quotation.status,
      manualEntry,
      createdByUserId,
    })
    .onConflictDoNothing({ target: documents.documentNumber })
    .returning();

  if (doc && items.length > 0) {
    await db.insert(documentLineItems).values(
      items.map((item) => ({
        documentId: doc.id,
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        discountCents: item.discountCents,
        sortOrder: item.sortOrder,
      })),
    );
  }

  return doc ?? (await db.select().from(documents).where(eq(documents.documentNumber, quotation.quotationNumber)).limit(1))[0] ?? null;
}

export async function createUnifiedDocument(input: CreateUnifiedDocumentInput): Promise<UnifiedDocumentResult> {
  if (!["quotation", "invoice", "receipt"].includes(input.type)) return { ok: false, message: "Unsupported document type." };
  if (input.lineItems.length < 1) return { ok: false, message: "At least one line item is required." };

  const bookingCharges = input.bookingId ? await getBookingCharges(input.bookingId) : null;
  const clientId = bookingCharges?.booking.clientId ?? input.clientId;
  if (!clientId) return { ok: false, message: "Select a booking or client before generating a document." };

  if (input.type === "quotation") {
    const result = await createQuotation({
      clientId,
      bookingId: input.bookingId ?? null,
      issueDate: input.issueDate,
      validUntil: input.validUntil ?? null,
      lineItems: input.lineItems,
      createdByUserId: input.createdByUserId,
    });
    if (!result.ok) return result;
    const doc = await mirrorQuotationDocument(result.id, !!input.manualEntry, input.createdByUserId);
    return { ok: true, id: doc?.id ?? result.id, documentNumber: result.quotationNumber, type: "quotation", totalCents: result.totalCents };
  }

  if (input.type === "invoice") {
    const dueDate = input.dueDate;
    if (!dueDate) return { ok: false, message: "Due date is required for invoices." };
    const result = await createInvoice({
      clientId,
      bookingId: input.bookingId ?? null,
      issueDate: input.issueDate,
      dueDate,
      lineItems: input.lineItems,
      createdByUserId: input.createdByUserId,
    });
    if (!result.ok) return result;
    const doc = await mirrorInvoiceDocument(result.id, !!input.manualEntry, input.createdByUserId);
    return { ok: true, id: doc?.id ?? result.id, documentNumber: result.invoiceNumber, type: "invoice", totalCents: result.totalCents };
  }

  const totals = calculateUnifiedTotals(input.lineItems);
  const payment = await recordPayment({
    clientId,
    bookingId: input.bookingId ?? null,
    amountCents: totals.totalCents,
    paymentDate: input.issueDate,
    method: "manual",
    description: input.lineItems[0]?.description ?? "Manual receipt",
    recordedByUserId: input.createdByUserId,
    generateReceipt: true,
  });
  if (!payment.ok) return payment;
  if (!payment.receiptId) return { ok: false, message: "Receipt could not be generated." };

  const db = getDb();
  await db.insert(receiptLineItems).values(
    input.lineItems.map((item, i) => ({
      receiptId: payment.receiptId!,
      serviceId: item.serviceId ?? null,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      discountCents: item.discountCents ?? 0,
      sortOrder: i,
    })),
  );

  const doc = await mirrorReceiptDocument(payment.receiptId, !!input.manualEntry, input.createdByUserId);
  await recordActivity(input.createdByUserId, "document.created", "document", doc?.id, `Document ${payment.receiptNumber} created`);
  return { ok: true, id: doc?.id ?? payment.receiptId, documentNumber: payment.receiptNumber!, type: "receipt", totalCents: totals.totalCents };
}

export async function listUnifiedDocuments(filters: {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
}) {
  const db = getDb();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 25;
  const where = and(
    filters.type ? eq(documents.type, filters.type) : undefined,
    filters.status ? eq(documents.status, filters.status) : undefined,
    filters.from ? gte(documents.issueDate, new Date(filters.from)) : undefined,
    filters.to ? lte(documents.issueDate, new Date(filters.to)) : undefined,
    filters.q ? or(ilike(documents.documentNumber, `%${filters.q}%`), ilike(clients.fullName, `%${filters.q}%`), ilike(bookings.reference, `%${filters.q}%`)) : undefined,
  );

  const [rows, [{ count: total }]] = await Promise.all([
    db
      .select({
        id: documents.id,
        documentNumber: documents.documentNumber,
        type: documents.type,
        issueDate: documents.issueDate,
        status: documents.status,
        totalCents: documents.totalCents,
        balanceCents: documents.balanceCents,
        clientName: clients.fullName,
        bookingReference: bookings.reference,
        sourceInvoiceId: documents.sourceInvoiceId,
        sourceQuotationId: documents.sourceQuotationId,
        sourceReceiptId: documents.sourceReceiptId,
      })
      .from(documents)
      .innerJoin(clients, eq(documents.clientId, clients.id))
      .leftJoin(bookings, eq(documents.bookingId, bookings.id))
      .where(where)
      .orderBy(desc(documents.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: count() }).from(documents).innerJoin(clients, eq(documents.clientId, clients.id)).leftJoin(bookings, eq(documents.bookingId, bookings.id)).where(where),
  ]);

  return { rows, total };
}
