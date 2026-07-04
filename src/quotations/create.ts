import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, invoiceLineItems, invoices, quotationLineItems, quotations } from "@/db/schema";
import { getNextDocumentNumber } from "@/documents/number";
import { recordActivity } from "@/activity-log/record";
import { notifyStaff } from "@/notifications/create";

export interface LineItemInput {
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents?: number;
}

export interface CreateQuotationInput {
  clientId: string;
  bookingId?: string | null;
  issueDate: Date;
  validUntil?: Date | null;
  lineItems: LineItemInput[];
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number | null;
  notes?: string | null;
  terms?: string | null;
  createdByUserId?: string | null;
}

export type QuotationResult = {
  ok: true;
  id: string;
  quotationNumber: string;
  totalCents: number;
} | { ok: false; message: string };

function calculateLineTotal(item: LineItemInput): number {
  return item.quantity * item.unitPriceCents - (item.discountCents ?? 0);
}

function calculateDiscountCents(
  subtotalCents: number,
  discountType: string | null | undefined,
  discountValue: number | null | undefined,
): number {
  if (!discountType || !discountValue) return 0;
  if (discountType === "percentage") return Math.round(subtotalCents * (discountValue / 100));
  if (discountType === "fixed") return discountValue;
  return 0;
}

export async function createQuotation(input: CreateQuotationInput): Promise<QuotationResult> {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [client] = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, input.clientId)).limit(1);
    if (!client) return { ok: false, message: "Client not found." } as QuotationResult;

    let quotationNumber: string;
    try {
      quotationNumber = await getNextDocumentNumber("quotation");
    } catch {
      return { ok: false, message: "Quotation numbering is not configured." } as QuotationResult;
    }

    const subtotalCents = input.lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    const discountCents = calculateDiscountCents(subtotalCents, input.discountType, input.discountValue);
    const totalCents = subtotalCents - discountCents;

    const [quotation] = await tx
      .insert(quotations)
      .values({
        quotationNumber,
        clientId: input.clientId,
        bookingId: input.bookingId ?? null,
        issueDate: input.issueDate,
        validUntil: input.validUntil ?? null,
        subtotalCents,
        discountType: input.discountType ?? null,
        discountValue: input.discountValue ?? null,
        discountCents,
        totalCents,
        status: "draft",
        notes: input.notes ?? null,
        terms: input.terms ?? null,
        createdByUserId: input.createdByUserId ?? null,
      })
      .returning();

    if (input.lineItems.length > 0) {
      await tx.insert(quotationLineItems).values(
        input.lineItems.map((item, i) => ({
          quotationId: quotation.id,
          serviceId: item.serviceId ?? null,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountCents: item.discountCents ?? 0,
          sortOrder: i,
        })),
      );
    }

    await recordActivity(input.createdByUserId ?? undefined, "quotation.created", "quotation", quotation.id, `Quotation ${quotationNumber} created (N$${(totalCents / 100).toFixed(2)})`);

    return { ok: true as const, id: quotation.id, quotationNumber, totalCents };
  });

  if (result.ok) {
    await notifyStaff("quotation.created", `Quotation ${result.quotationNumber}`, `Quotation ${result.quotationNumber} for N$${(result.totalCents / 100).toFixed(2)} created`, "quotation", result.id);
  }
  return result;
}

export async function issueQuotation(quotationId: string, userId: string): Promise<QuotationResult> {
  const db = getDb();
  const [q] = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
  if (!q) return { ok: false, message: "Quotation not found." };
  if (q.status !== "draft") return { ok: false, message: "Only draft quotations can be issued." };

  const now = new Date();
  await db
    .update(quotations)
    .set({ status: "issued", issuedAt: now, updatedAt: now })
    .where(eq(quotations.id, quotationId));

  await recordActivity(userId, "quotation.issued", "quotation", quotationId, `Quotation ${q.quotationNumber} issued`);
  await notifyStaff("quotation.issued", `Quotation ${q.quotationNumber} issued`, `Quotation ${q.quotationNumber} issued for N$${(q.totalCents / 100).toFixed(2)}`, "quotation", quotationId);
  return { ok: true, id: quotationId, quotationNumber: q.quotationNumber, totalCents: q.totalCents };
}

export async function acceptQuotation(quotationId: string, userId: string): Promise<QuotationResult> {
  const db = getDb();
  const [q] = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
  if (!q) return { ok: false, message: "Quotation not found." };
  if (q.status !== "issued") return { ok: false, message: "Only issued quotations can be accepted." };

  const now = new Date();
  await db
    .update(quotations)
    .set({ status: "accepted", acceptedAt: now, updatedAt: now })
    .where(eq(quotations.id, quotationId));

  await recordActivity(userId, "quotation.accepted", "quotation", quotationId, `Quotation ${q.quotationNumber} accepted`);
  return { ok: true, id: quotationId, quotationNumber: q.quotationNumber, totalCents: q.totalCents };
}

export async function rejectQuotation(quotationId: string, reason: string, userId: string): Promise<QuotationResult> {
  const db = getDb();
  const [q] = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
  if (!q) return { ok: false, message: "Quotation not found." };
  if (q.status !== "issued") return { ok: false, message: "Only issued quotations can be rejected." };

  const now = new Date();
  await db
    .update(quotations)
    .set({ status: "rejected", rejectedAt: now, rejectedReason: reason, updatedAt: now })
    .where(eq(quotations.id, quotationId));

  await recordActivity(userId, "quotation.rejected", "quotation", quotationId, `Quotation ${q.quotationNumber} rejected: ${reason}`);
  return { ok: true, id: quotationId, quotationNumber: q.quotationNumber, totalCents: q.totalCents };
}

export async function convertQuotationToInvoice(quotationId: string, userId: string): Promise<{ ok: true; invoiceId: string; invoiceNumber: string } | { ok: false; message: string }> {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [q] = await tx.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
    if (!q) return { ok: false as const, message: "Quotation not found." };
    if (q.status !== "accepted") return { ok: false as const, message: "Only accepted quotations can be converted to invoices." };

    const items = await tx
      .select()
      .from(quotationLineItems)
      .where(eq(quotationLineItems.quotationId, quotationId))
      .orderBy(quotationLineItems.sortOrder);

    let invoiceNumber: string;
    try {
      invoiceNumber = await getNextDocumentNumber("invoice");
    } catch {
      return { ok: false as const, message: "Invoice numbering is not configured." };
    }

    const [invoice] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        clientId: q.clientId,
        bookingId: q.bookingId,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 86400000),
        subtotalCents: q.subtotalCents,
        discountType: q.discountType,
        discountValue: q.discountValue,
        discountCents: q.discountCents,
        taxCents: 0,
        totalCents: q.totalCents,
        balanceCents: q.totalCents,
        status: "draft",
        notes: q.notes,
        terms: q.terms,
        createdByUserId: userId,
      })
      .returning();

    if (items.length > 0) {
      await tx.insert(invoiceLineItems).values(
        items.map((item, i) => ({
          invoiceId: invoice.id,
          serviceId: item.serviceId,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountCents: item.discountCents,
          sortOrder: i,
        })),
      );
    }

    await tx
      .update(quotations)
      .set({ status: "converted", convertedToInvoiceId: invoice.id, updatedAt: new Date() })
      .where(eq(quotations.id, quotationId));

    await recordActivity(userId, "quotation.converted", "quotation", quotationId, `Quotation ${q.quotationNumber} converted to invoice ${invoiceNumber}`);
    await recordActivity(userId, "invoice.created", "invoice", invoice.id, `Invoice ${invoiceNumber} created from quotation ${q.quotationNumber}`);

    return { ok: true as const, invoiceId: invoice.id, invoiceNumber } as const;
  });

  if (result.ok) {
    await notifyStaff("invoice.created", `Invoice ${result.invoiceNumber}`, `Invoice ${result.invoiceNumber} created from quotation`, "invoice", result.invoiceId);
  }
  return result;
}

export async function duplicateQuotation(quotationId: string, userId: string): Promise<QuotationResult> {
  const db = getDb();
  const [q] = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
  if (!q) return { ok: false, message: "Quotation not found." };

  const result = await db.transaction(async (tx) => {
    const items = await tx
      .select()
      .from(quotationLineItems)
      .where(eq(quotationLineItems.quotationId, quotationId))
      .orderBy(quotationLineItems.sortOrder);

    let quotationNumber: string;
    try {
      quotationNumber = await getNextDocumentNumber("quotation");
    } catch {
      return { ok: false, message: "Quotation numbering is not configured." } as QuotationResult;
    }

    const [duplicate] = await tx
      .insert(quotations)
      .values({
        quotationNumber,
        clientId: q.clientId,
        bookingId: q.bookingId,
        issueDate: new Date(),
        validUntil: q.validUntil,
        subtotalCents: q.subtotalCents,
        discountType: q.discountType,
        discountValue: q.discountValue,
        discountCents: q.discountCents,
        totalCents: q.totalCents,
        status: "draft",
        notes: q.notes,
        terms: q.terms,
        createdByUserId: userId ?? null,
      })
      .returning();

    if (items.length > 0) {
      await tx.insert(quotationLineItems).values(
        items.map((item, i) => ({
          quotationId: duplicate.id,
          serviceId: item.serviceId,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountCents: item.discountCents,
          sortOrder: i,
        })),
      );
    }

    await recordActivity(userId ?? undefined, "quotation.duplicated", "quotation", duplicate.id, `Quotation ${quotationNumber} duplicated from ${q.quotationNumber}`);

    return { ok: true as const, id: duplicate.id, quotationNumber, totalCents: q.totalCents };
  });

  if (result.ok) {
    await notifyStaff("quotation.created", `Quotation ${result.quotationNumber}`, `Quotation ${result.quotationNumber} duplicated — N$${(result.totalCents / 100).toFixed(2)}`, "quotation", result.id);
  }
  return result;
}

export async function voidQuotation(quotationId: string, reason: string, userId: string): Promise<QuotationResult> {
  const db = getDb();
  const [q] = await db.select().from(quotations).where(eq(quotations.id, quotationId)).limit(1);
  if (!q) return { ok: false, message: "Quotation not found." };
  if (q.status === "voided" || q.status === "converted") return { ok: false, message: "Cannot void a converted or already voided quotation." };

  const now = new Date();
  await db
    .update(quotations)
    .set({ status: "voided", voidedAt: now, voidReason: reason, updatedAt: now })
    .where(eq(quotations.id, quotationId));

  await recordActivity(userId, "quotation.voided", "quotation", quotationId, `Quotation ${q.quotationNumber} voided: ${reason}`);
  return { ok: true, id: quotationId, quotationNumber: q.quotationNumber, totalCents: q.totalCents };
}
