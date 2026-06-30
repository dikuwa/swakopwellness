"use server";

import { requireAuth } from "@/auth/session";
import { issueInvoice, voidInvoice } from "@/invoices/create";
import { redirect } from "next/navigation";

export async function issueInvoiceAction(formData: FormData) {
  const user = await requireAuth();
  const invoiceId = formData.get("invoice_id") as string;

  if (!invoiceId) throw new Error("Invoice ID is required.");

  const result = await issueInvoice(invoiceId, user.id);
  if (!result.ok) throw new Error(result.message);

  redirect(`/dashboard/invoices/${invoiceId}`);
}

export async function voidInvoiceAction(formData: FormData) {
  const user = await requireAuth();
  const invoiceId = formData.get("invoice_id") as string;
  const reason = (formData.get("reason") as string) || "No reason provided";

  if (!invoiceId) throw new Error("Invoice ID is required.");

  const result = await voidInvoice(invoiceId, reason, user.id);
  if (!result.ok) throw new Error(result.message);

  redirect(`/dashboard/invoices/${invoiceId}`);
}
