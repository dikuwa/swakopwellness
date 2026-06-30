"use server";

import { requirePermission } from "@/auth/session";
import { createInvoice } from "@/invoices/create";
import { redirect } from "next/navigation";

export async function createInvoiceAction(formData: FormData) {
  const user = await requirePermission("documents:create");

  const clientId = formData.get("client_id") as string;
  const issueDateStr = formData.get("issue_date") as string;
  const dueDateStr = formData.get("due_date") as string;
  const discountType = (formData.get("discount_type") as string) || null;
  const discountValueStr = formData.get("discount_value") as string;
  const notes = (formData.get("notes") as string) || null;
  const terms = (formData.get("terms") as string) || null;

  if (!clientId || !issueDateStr || !dueDateStr) {
    throw new Error("Client, issue date, and due date are required.");
  }

  const lineCount = parseInt(formData.get("line_count") as string) || 0;
  if (lineCount < 1) {
    throw new Error("At least one line item is required.");
  }

  const lineItems = [];
  for (let i = 0; i < lineCount; i++) {
    const description = formData.get(`description_${i}`) as string;
    const quantityStr = formData.get(`quantity_${i}`) as string;
    const unitPriceStr = formData.get(`unit_price_${i}`) as string;
    const serviceId = (formData.get(`service_id_${i}`) as string) || null;

    if (!description || !quantityStr || !unitPriceStr) {
      throw new Error(`Line item ${i + 1} is incomplete.`);
    }

    lineItems.push({
      description,
      quantity: parseInt(quantityStr) || 1,
      unitPriceCents: Math.round((parseFloat(unitPriceStr) || 0) * 100),
      serviceId,
      discountCents: 0,
    });
  }

  const discountValue = discountValueStr ? parseInt(discountValueStr) : null;

  const result = await createInvoice({
    clientId,
    issueDate: new Date(issueDateStr),
    dueDate: new Date(dueDateStr),
    lineItems,
    discountType: (discountType === "none" ? null : discountType) as "percentage" | "fixed" | null,
    discountValue,
    notes,
    terms,
    createdByUserId: user.id,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  redirect(`/dashboard/invoices/${result.id}`);
}
