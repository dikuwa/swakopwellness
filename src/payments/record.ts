import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { clients, invoices, payments, receipts } from "@/db/schema";
import { recordActivity } from "@/activity-log/record";
import { notifyStaff } from "@/notifications/create";

export interface RecordPaymentInput {
  clientId: string;
  invoiceId?: string | null;
  bookingId?: string | null;
  amountCents: number;
  paymentDate: Date;
  method: string;
  reference?: string | null;
  description?: string | null;
  notes?: string | null;
  recordedByUserId: string;
  generateReceipt?: boolean;
}

export type PaymentResult = {
  ok: true;
  id: string;
  receiptId?: string;
  receiptNumber?: string;
  invoiceStatus?: string;
  message?: string;
} | { ok: false; message: string };

export async function recordPayment(input: RecordPaymentInput): Promise<PaymentResult> {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [client] = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, input.clientId)).limit(1);
    if (!client) return { ok: false, message: "Client not found." } as PaymentResult;

    const [payment] = await tx
      .insert(payments)
      .values({
        clientId: input.clientId,
        invoiceId: input.invoiceId ?? null,
        bookingId: input.bookingId ?? null,
        amountCents: input.amountCents,
        paymentDate: input.paymentDate,
        method: input.method,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        recordedByUserId: input.recordedByUserId,
      })
      .returning();

    let newInvoiceStatus: string | undefined;
    if (input.invoiceId) {
      const [inv] = await tx.select().from(invoices).where(eq(invoices.id, input.invoiceId)).limit(1);
      if (inv) {
        const newPaid = inv.amountPaidCents + input.amountCents;
        const newBalance = inv.totalCents - newPaid;
        const status = newBalance <= 0 ? "paid" : newPaid > 0 ? "partially_paid" : inv.status;
        await tx
          .update(invoices)
          .set({ amountPaidCents: newPaid, balanceCents: newBalance, status, updatedAt: new Date() })
          .where(eq(invoices.id, input.invoiceId));
        newInvoiceStatus = status;
      }
    }

    await recordActivity(
      input.recordedByUserId,
      "payment.recorded",
      "payment",
      payment.id,
      `Payment of N$${(input.amountCents / 100).toFixed(2)} recorded (${input.method})`,
    );

    let receiptId: string | undefined;
    let receiptNumber: string | undefined;

    if (input.generateReceipt) {
      const { getNextDocumentNumber } = await import("@/documents/number");
      try {
        const num = await getNextDocumentNumber("receipt");
        receiptNumber = num;
      } catch {
        return { ok: true, id: payment.id, message: "Payment recorded but receipt numbering not configured." } satisfies PaymentResult;
      }

      const [receipt] = await tx
        .insert(receipts)
        .values({
          receiptNumber: receiptNumber!,
          paymentId: payment.id,
          clientId: input.clientId,
          bookingId: input.bookingId ?? null,
          invoiceId: input.invoiceId ?? null,
          amountCents: input.amountCents,
          paymentDate: input.paymentDate,
          paymentMethod: input.method,
          paymentReference: input.reference ?? null,
          description: input.description ?? null,
          notes: input.notes ?? null,
          receivedByUserId: input.recordedByUserId,
        })
        .returning();

      receiptId = receipt.id;

      await recordActivity(
        input.recordedByUserId,
        "receipt.created",
        "receipt",
        receipt.id,
        `Receipt ${receiptNumber} issued for N$${(input.amountCents / 100).toFixed(2)}`,
      );
    }

    return { ok: true as const, id: payment.id, receiptId, receiptNumber, invoiceStatus: newInvoiceStatus };
  });

  if (result.ok) {
    await notifyStaff("payment.recorded", `Payment recorded`, `Payment of N$${(input.amountCents / 100).toFixed(2)} recorded (${input.method})`, "payment", result.id);
  }
  return result;
}

