"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { receiptLineItems } from "@/db/schema";
import { recordPayment } from "@/payments/record";
import { dollarsToCents, calculateDocumentTotals } from "@/documents/calculate";

export async function createReceiptAction(formData: FormData) {
  const user = await requirePermission("payments:record");

  const clientId = formData.get("clientId") as string;
  const paymentDateStr = formData.get("paymentDate") as string;
  const method = formData.get("method") as string;
  const description = (formData.get("description") as string) || null;
  const reference = (formData.get("reference") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const invoiceId = (formData.get("invoiceId") as string) || null;
  const amountOverride = formData.get("amountOverride") as string;

  if (!clientId || !paymentDateStr || !method) {
    throw new Error("Client, payment date, and method are required.");
  }

  // Parse line items from form
  const lineCount = parseInt(formData.get("line_count") as string) || 0;
  const lineItems = [];
  for (let i = 0; i < lineCount; i++) {
    const serviceId = (formData.get(`service_id_${i}`) as string) || null;
    const desc = formData.get(`description_${i}`) as string;
    const qtyStr = formData.get(`quantity_${i}`) as string;
    const priceStr = formData.get(`unit_price_${i}`) as string;
    const discStr = formData.get(`discount_${i}`) as string;

    if (!desc || !qtyStr || !priceStr) continue;

    const quantity = parseInt(qtyStr) || 1;
    const unitPriceCents = dollarsToCents(priceStr);
    const discountCents = dollarsToCents(discStr || "0");

    lineItems.push({
      serviceId: serviceId || null,
      description: desc,
      quantity,
      unitPriceCents,
      discountCents: Math.min(discountCents, quantity * unitPriceCents),
    });
  }

  // Calculate total from line items or use override
  const totals = calculateDocumentTotals(lineItems);
  const amountCents = amountOverride
    ? dollarsToCents(amountOverride)
    : totals.totalCents;

  if (amountCents <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const paymentDate = new Date(paymentDateStr);

  // Record payment + generate receipt
  const result = await recordPayment({
    clientId,
    amountCents,
    paymentDate,
    method,
    description,
    reference,
    notes,
    invoiceId: invoiceId || null,
    recordedByUserId: user.id,
    generateReceipt: true,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  // Save line items to receipt_line_items
  if (result.receiptId && lineItems.length > 0) {
    const db = getDb();
    await db.insert(receiptLineItems).values(
      lineItems.map((item, i) => ({
        receiptId: result.receiptId!,
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        discountCents: item.discountCents,
        sortOrder: i,
      })),
    );
  }

  redirect(`/dashboard/receipts/${result.receiptId}`);
}
