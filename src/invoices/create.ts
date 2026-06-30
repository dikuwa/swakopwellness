import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, invoiceLineItems, invoices } from "@/db/schema";
import { getNextDocumentNumber } from "@/documents/number";
import { recordActivity } from "@/activity-log/record";

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
  return db.transaction(async (tx) => {
    const [client] = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, input.clientId)).limit(1);
    if (!client) return { ok: false, message: "Client not found." };

    let invoiceNumber: string;
    try {
      invoiceNumber = await getNextDocumentNumber("invoice");
    } catch {
      return { ok: false, message: "Invoice numbering is not configured." };
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

    return { ok: true, id: invoice.id, invoiceNumber, totalCents };
  });
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
  return { ok: true, id: invoiceId, invoiceNumber: invoice.invoiceNumber, totalCents: invoice.totalCents };
}
