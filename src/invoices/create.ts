import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, invoiceLineItems, invoices } from "@/db/schema";
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

export interface CreateInvoiceInput {
  clientId: string;
  bookingId?: string | null;
  issueDate: Date;
  dueDate: Date;
  lineItems: LineItemInput[];
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number | null;
  taxCents?: number;
  notes?: string | null;
  terms?: string | null;
  createdByUserId?: string | null;
}

export type InvoiceResult = {
  ok: true;
  id: string;
  invoiceNumber: string;
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

export async function createInvoice(input: CreateInvoiceInput): Promise<InvoiceResult> {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [client] = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, input.clientId)).limit(1);
    if (!client) return { ok: false, message: "Client not found." } as InvoiceResult;

    let invoiceNumber: string;
    try {
      invoiceNumber = await getNextDocumentNumber("invoice");
    } catch {
      return { ok: false, message: "Invoice numbering is not configured." } as InvoiceResult;
    }

    const subtotalCents = input.lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    const discountCents = calculateDiscountCents(subtotalCents, input.discountType, input.discountValue);
    const taxCents = input.taxCents ?? 0;
    const totalCents = subtotalCents - discountCents + taxCents;

    const [invoice] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        clientId: input.clientId,
        bookingId: input.bookingId ?? null,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        subtotalCents,
        discountType: input.discountType ?? null,
        discountValue: input.discountValue ?? null,
        discountCents,
        taxCents,
        totalCents,
        balanceCents: totalCents,
        status: "draft",
        notes: input.notes ?? null,
        terms: input.terms ?? null,
        createdByUserId: input.createdByUserId ?? null,
      })
      .returning();

    if (input.lineItems.length > 0) {
      await tx.insert(invoiceLineItems).values(
        input.lineItems.map((item, i) => ({
          invoiceId: invoice.id,
          serviceId: item.serviceId ?? null,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountCents: item.discountCents ?? 0,
          sortOrder: i,
        })),
      );
    }

    await recordActivity(input.createdByUserId ?? undefined, "invoice.created", "invoice", invoice.id, `Invoice ${invoiceNumber} created (N$${(totalCents / 100).toFixed(2)})`);

    return { ok: true as const, id: invoice.id, invoiceNumber, totalCents };
  });

  if (result.ok) {
    await notifyStaff("invoice.created", `Invoice ${result.invoiceNumber}`, `Invoice ${result.invoiceNumber} for N$${(result.totalCents / 100).toFixed(2)} created`, "invoice", result.id);
  }
  return result;
}

export async function updateInvoice(
  invoiceId: string,
  input: CreateInvoiceInput,
): Promise<InvoiceResult> {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);
    if (!existing) return { ok: false, message: "Invoice not found." } as InvoiceResult;
    if (existing.status !== "draft") return { ok: false, message: "Only draft invoices can be edited." } as InvoiceResult;

    const [client] = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, input.clientId)).limit(1);
    if (!client) return { ok: false, message: "Client not found." } as InvoiceResult;

    const subtotalCents = input.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents - (item.discountCents ?? 0), 0);
    const discountCents = calculateDiscountCents(subtotalCents, input.discountType, input.discountValue);
    const taxCents = input.taxCents ?? 0;
    const totalCents = subtotalCents - discountCents + taxCents;

    await tx
      .update(invoices)
      .set({
        clientId: input.clientId,
        bookingId: input.bookingId ?? null,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        subtotalCents,
        discountType: input.discountType ?? null,
        discountValue: input.discountValue ?? null,
        discountCents,
        taxCents,
        totalCents,
        balanceCents: totalCents,
        notes: input.notes ?? null,
        terms: input.terms ?? null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    // Replace all line items
    const existingIds = await tx
      .select({ id: invoiceLineItems.id })
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId));
    if (existingIds.length > 0) {
      await tx
        .delete(invoiceLineItems)
        .where(inArray(invoiceLineItems.id, existingIds.map((r) => r.id)));
    }

    if (input.lineItems.length > 0) {
      await tx.insert(invoiceLineItems).values(
        input.lineItems.map((item, i) => ({
          invoiceId,
          serviceId: item.serviceId ?? null,
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountCents: item.discountCents ?? 0,
          sortOrder: i,
        })),
      );
    }

    await recordActivity(input.createdByUserId ?? undefined, "invoice.updated", "invoice", invoiceId, `Invoice ${existing.invoiceNumber} updated`);

    return { ok: true as const, id: invoiceId, invoiceNumber: existing.invoiceNumber, totalCents };
  });

  if (result.ok) {
    await notifyStaff("invoice.updated", `Invoice ${result.invoiceNumber}`, `Invoice ${result.invoiceNumber} updated`, "invoice", invoiceId);
  }
  return result;
}

export async function issueInvoice(invoiceId: string, userId: string): Promise<InvoiceResult> {
  const db = getDb();
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!invoice) return { ok: false, message: "Invoice not found." };
  if (invoice.status !== "draft") return { ok: false, message: "Only draft invoices can be issued." };

  const now = new Date();
  await db
    .update(invoices)
    .set({ status: "issued", issuedAt: now, updatedAt: now })
    .where(eq(invoices.id, invoiceId));

  await recordActivity(userId, "invoice.issued", "invoice", invoiceId, `Invoice ${invoice.invoiceNumber} issued`);
  await notifyStaff("invoice.issued", `Invoice ${invoice.invoiceNumber} issued`, `Invoice ${invoice.invoiceNumber} issued for N$${(invoice.totalCents / 100).toFixed(2)}`, "invoice", invoiceId);
  return { ok: true, id: invoiceId, invoiceNumber: invoice.invoiceNumber, totalCents: invoice.totalCents };
}

export async function voidInvoice(invoiceId: string, reason: string, userId: string): Promise<InvoiceResult> {
  const db = getDb();
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!invoice) return { ok: false, message: "Invoice not found." };
  if (invoice.status === "voided" || invoice.status === "paid") return { ok: false, message: "Cannot void a paid or already voided invoice." };

  const now = new Date();
  await db
    .update(invoices)
    .set({ status: "voided", voidedAt: now, voidReason: reason, updatedAt: now })
    .where(eq(invoices.id, invoiceId));

  await recordActivity(userId, "invoice.voided", "invoice", invoiceId, `Invoice ${invoice.invoiceNumber} voided: ${reason}`);
  await notifyStaff("invoice.voided", `Invoice ${invoice.invoiceNumber} voided`, `Invoice ${invoice.invoiceNumber} voided: ${reason}`, "invoice", invoiceId);
  return { ok: true, id: invoiceId, invoiceNumber: invoice.invoiceNumber, totalCents: invoice.totalCents };
}
