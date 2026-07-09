import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookings, clients, documents, invoices } from "@/db/schema";
import { canApplyPayment, mirrorReceiptDocument } from "@/lib/models/document";
import { recordPayment } from "@/payments/record";

export interface ApiRecordPaymentInput {
  bookingId?: string | null;
  invoiceId?: string | null;
  clientId?: string | null;
  method: string;
  amountCents: number;
  reference?: string | null;
  recordedByUserId: string;
}

export function resolveInvoicePaymentBookingId(inputBookingId: string | null | undefined, invoiceBookingId: string | null) {
  return invoiceBookingId ?? null;
}

export async function recordWorkflowPayment(input: ApiRecordPaymentInput) {
  const db = getDb();
  let clientId = input.clientId ?? null;
  let bookingId = input.bookingId ?? null;
  let outstandingCents: number | null = null;

  if (input.invoiceId) {
    const [invoice] = await db
      .select({
        id: invoices.id,
        clientId: invoices.clientId,
        bookingId: invoices.bookingId,
        balanceCents: invoices.balanceCents,
        status: invoices.status,
      })
      .from(invoices)
      .where(eq(invoices.id, input.invoiceId))
      .limit(1);
    if (!invoice) return { ok: false as const, message: "Invoice not found." };
    if (invoice.status === "voided") return { ok: false as const, message: "Cannot record payment against a voided invoice." };
    clientId = invoice.clientId;
    bookingId = resolveInvoicePaymentBookingId(input.bookingId, invoice.bookingId);
    outstandingCents = invoice.balanceCents;
  }

  if (!clientId && bookingId) {
    const [booking] = await db.select({ clientId: bookings.clientId }).from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (!booking) return { ok: false as const, message: "Booking not found." };
    clientId = booking.clientId;
  }

  if (!clientId) return { ok: false as const, message: "Select a booking, invoice, or client before recording a payment." };
  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) return { ok: false as const, message: "Client not found." };

  if (outstandingCents !== null) {
    const check = canApplyPayment(input.amountCents, outstandingCents);
    if (!check.ok) return check;
  }

  const result = await recordPayment({
    clientId,
    bookingId,
    invoiceId: input.invoiceId ?? null,
    amountCents: input.amountCents,
    paymentDate: new Date(),
    method: input.method,
    reference: input.reference ?? null,
    recordedByUserId: input.recordedByUserId,
    generateReceipt: false,
  });

  if (result.ok && input.invoiceId) {
    const [updatedInvoice] = await db.select().from(invoices).where(eq(invoices.id, input.invoiceId)).limit(1);
    if (updatedInvoice) {
      await db
        .update(documents)
        .set({
          amountPaidCents: updatedInvoice.amountPaidCents,
          balanceCents: updatedInvoice.balanceCents,
          status: updatedInvoice.status,
          updatedAt: new Date(),
        })
        .where(eq(documents.sourceInvoiceId, input.invoiceId));
    }
    if (result.receiptId) {
      await mirrorReceiptDocument(result.receiptId, false, input.recordedByUserId);
    }
  }

  return result;
}
