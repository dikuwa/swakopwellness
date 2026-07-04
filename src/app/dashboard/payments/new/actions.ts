"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/auth/session";
import { recordPayment } from "@/payments/record";

export async function createPaymentAction(formData: FormData) {
  const user = await requirePermission("payments:record");

  const clientId = formData.get("clientId") as string;
  const amountDollars = formData.get("amount") as string;
  const paymentDateStr = formData.get("paymentDate") as string;
  const method = formData.get("method") as string;
  const reference = (formData.get("reference") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const invoiceId = (formData.get("invoiceId") as string) || null;
  const generateReceipt = formData.get("generateReceipt") === "on";

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
    generateReceipt,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  const destId = result.receiptId ? `/dashboard/receipts/${result.receiptId}` : `/dashboard/payments/${result.id}`;
  redirect(destId);
}
