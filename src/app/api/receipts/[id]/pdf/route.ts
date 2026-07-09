import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { businessSettings, clients, invoices, receiptLineItems, receipts } from "@/db/schema";
import { generateReceiptPdf, type BusinessData, type ReceiptData } from "@/documents/pdf";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  await requirePermission("financials:view");
  const { id } = await props.params;

  const db = getDb();

  const [receipt] = await db
    .select({
      id: receipts.id,
      receiptNumber: receipts.receiptNumber,
      amountCents: receipts.amountCents,
      paymentDate: receipts.paymentDate,
      paymentMethod: receipts.paymentMethod,
      paymentReference: receipts.paymentReference,
      description: receipts.description,
      notes: receipts.notes,
      clientId: receipts.clientId,
      invoiceId: receipts.invoiceId,
    })
    .from(receipts)
    .where(eq(receipts.id, id))
    .limit(1);

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  const [client] = await db.select().from(clients).where(eq(clients.id, receipt.clientId)).limit(1);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  let invoiceNumber: string | undefined;
  if (receipt.invoiceId) {
    const [inv] = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(eq(invoices.id, receipt.invoiceId))
      .limit(1);
    if (inv) invoiceNumber = inv.invoiceNumber;
  }

  const [business] = await db.select().from(businessSettings).limit(1);
  if (!business) {
    return NextResponse.json({ error: "Business settings not configured" }, { status: 500 });
  }

  const docDetails = (business.documentDetails ?? {}) as Record<string, unknown>;

  const businessData: BusinessData = {
    businessName: business.businessName,
    address: business.address,
    phone: business.telephone,
    email: business.email,
    registrationNumber: (docDetails.registrationNumber as string) ?? undefined,
    taxNumber: (docDetails.taxNumber as string) ?? undefined,
    bankingDetails: (docDetails.bankingDetails as string) ?? undefined,
    footerMessage: (docDetails.footerMessage as string) ?? undefined,
    signatureName: (docDetails.signatureName as string) ?? undefined,
    signatureRole: (docDetails.signatureRole as string) ?? undefined,
  };

  const receiptLineItemsData = await db
    .select()
    .from(receiptLineItems)
    .where(eq(receiptLineItems.receiptId, receipt.id))
    .orderBy(asc(receiptLineItems.sortOrder));

  const receiptData: ReceiptData = {
    receiptNumber: receipt.receiptNumber,
    paymentDate: receipt.paymentDate,
    clientName: client.fullName,
    clientPhone: client.phone ?? "",
    clientEmail: client.email ?? "",
    invoiceNumber,
    amountCents: receipt.amountCents,
    method: receipt.paymentMethod,
    reference: receipt.paymentReference ?? "",
    description: receipt.description ?? "",
    notes: receipt.notes ?? "",
    lineItems: receiptLineItemsData.length > 0
      ? receiptLineItemsData.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountCents: item.discountCents,
          totalCents: item.quantity * item.unitPriceCents - item.discountCents,
        }))
      : undefined,
  };

  const pdfBuffer = await generateReceiptPdf(receiptData, businessData);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receipt.receiptNumber}.pdf"`,
    },
  });
}
