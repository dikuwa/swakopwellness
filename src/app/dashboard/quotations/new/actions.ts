"use server";

import { requirePermission } from "@/auth/session";
import { createQuotation } from "@/quotations/create";
import { redirect } from "next/navigation";

export async function createQuotationAction(formData: FormData) {
  const user = await requirePermission("documents:create");

  const clientId = formData.get("client_id") as string;
  const issueDateStr = formData.get("issue_date") as string;
  const validUntilStr = formData.get("valid_until") as string;
  const discountType = (formData.get("discount_type") as string) || null;
  const discountValueStr = formData.get("discount_value") as string;
  const notes = (formData.get("notes") as string) || null;
  const terms = (formData.get("terms") as string) || null;

  if (!clientId || !issueDateStr) {
    throw new Error("Client and issue date are required.");
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

  const result = await createQuotation({
    clientId,
    issueDate: new Date(issueDateStr),
    validUntil: validUntilStr ? new Date(validUntilStr) : null,
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

  redirect(`/dashboard/quotations/${result.id}`);
}
