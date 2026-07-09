import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { businessSettings, clients, invoiceLineItems, invoices } from "@/db/schema";
import { generateInvoicePdf, type BusinessData, type InvoiceData } from "@/documents/pdf";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  await requirePermission("financials:view");
  const { id } = await props.params;

  const db = getDb();

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const items = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id))
    .orderBy(invoiceLineItems.sortOrder);

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

  const invoiceData: InvoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    clientName: client.fullName,
    clientPhone: client.phone ?? "",
    clientEmail: client.email ?? "",
    lineItems: items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      discountCents: item.discountCents,
      totalCents: item.quantity * item.unitPriceCents - item.discountCents,
    })),
    subtotalCents: invoice.subtotalCents,
    discountCents: invoice.discountCents,
    taxCents: invoice.taxCents,
    totalCents: invoice.totalCents,
    paidCents: invoice.amountPaidCents,
    balanceCents: invoice.balanceCents,
    notes: invoice.notes ?? "",
    terms: invoice.terms ?? "",
  };

  const pdfBuffer = await generateInvoicePdf(invoiceData, businessData);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
