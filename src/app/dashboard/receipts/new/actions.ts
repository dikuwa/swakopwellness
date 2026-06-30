"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/auth/session";
import { recordPayment } from "@/payments/record";

export async function createReceiptAction(formData: FormData) {
  const user = await requireAuth();

  const clientId = formData.get("clientId") as string;
  const amountDollars = formData.get("amount") as string;
  const paymentDateStr = formData.get("paymentDate") as string;
  const method = formData.get("method") as string;
  const reference = (formData.get("reference") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const invoiceId = (formData.get("invoiceId") as string) || null;

  if (!clientId || !amountDollars || !paymentDateStr || !method) {
    throw new Error("clientId, amount, paymentDate and method are required.");
  }

  const amountCents = Math.round(parseFloat(amountDollars) * 100);

  if (amountCents <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const paymentDate = new Date(paymentDateStr);

  const result = await recordPayment({
    clientId,
    amountCents,
    paymentDate,
    method,
    reference,
    notes,
    invoiceId,
    recordedByUserId: user.id,
    generateReceipt: true,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  redirect(`/dashboard/receipts/${result.receiptId}`);
}
