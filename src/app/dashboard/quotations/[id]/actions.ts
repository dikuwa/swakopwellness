"use server";

import { requirePermission } from "@/auth/session";
import { acceptQuotation, convertQuotationToInvoice, duplicateQuotation, issueQuotation, rejectQuotation, voidQuotation } from "@/quotations/create";
import { sendQuotationEmail } from "@/email/send";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function issueQuotationAction(formData: FormData) {
  const user = await requirePermission("documents:create");
  const quotationId = formData.get("quotation_id") as string;
  if (!quotationId) throw new Error("Quotation ID is required.");
  const result = await issueQuotation(quotationId, user.id);
  if (!result.ok) throw new Error(result.message);
  redirect(`/dashboard/quotations/${quotationId}`);
}

export async function acceptQuotationAction(formData: FormData) {
  const user = await requirePermission("documents:create");
  const quotationId = formData.get("quotation_id") as string;
  if (!quotationId) throw new Error("Quotation ID is required.");
  const result = await acceptQuotation(quotationId, user.id);
  if (!result.ok) throw new Error(result.message);
  revalidatePath(`/dashboard/quotations/${quotationId}`);
}

export async function rejectQuotationAction(formData: FormData) {
  const user = await requirePermission("documents:create");
  const quotationId = formData.get("quotation_id") as string;
  const reason = (formData.get("reason") as string) || "No reason provided";
  if (!quotationId) throw new Error("Quotation ID is required.");
  const result = await rejectQuotation(quotationId, reason, user.id);
  if (!result.ok) throw new Error(result.message);
  revalidatePath(`/dashboard/quotations/${quotationId}`);
}

export async function convertToInvoiceAction(formData: FormData) {
  const user = await requirePermission("documents:create");
  const quotationId = formData.get("quotation_id") as string;
  if (!quotationId) throw new Error("Quotation ID is required.");
  const result = await convertQuotationToInvoice(quotationId, user.id);
  if (!result.ok) throw new Error(result.message);
  redirect(`/dashboard/invoices/${result.invoiceId}`);
}

export async function emailQuotationAction(formData: FormData) {
  await requirePermission("financials:view");
  const quotationId = formData.get("quotation_id") as string;

  if (!quotationId) throw new Error("Quotation ID is required.");

  const result = await sendQuotationEmail(quotationId);
  if (!result.ok) throw new Error(result.error);

  revalidatePath(`/dashboard/quotations/${quotationId}`);
}

export async function duplicateQuotationAction(formData: FormData) {
  const user = await requirePermission("documents:create");
  const quotationId = formData.get("quotation_id") as string;
  if (!quotationId) throw new Error("Quotation ID is required.");
  const result = await duplicateQuotation(quotationId, user.id);
  if (!result.ok) throw new Error(result.message);
  redirect(`/dashboard/quotations/${result.id}`);
}

export async function voidQuotationAction(formData: FormData) {
  const user = await requirePermission("documents:void");
  const quotationId = formData.get("quotation_id") as string;
  const reason = (formData.get("reason") as string) || "No reason provided";
  if (!quotationId) throw new Error("Quotation ID is required.");
  const result = await voidQuotation(quotationId, reason, user.id);
  if (!result.ok) throw new Error(result.message);
  revalidatePath(`/dashboard/quotations/${quotationId}`);
}
