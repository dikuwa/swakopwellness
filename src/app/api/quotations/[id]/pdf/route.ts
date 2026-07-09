import { notFound } from "next/navigation";
import { requirePermission } from "@/auth/session";
import { getQuotationById } from "@/dashboard/data";
import { getDb } from "@/db/client";
import { businessSettings, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateQuotationPdf } from "@/documents/pdf";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePermission("financials:view");
  const { id } = await params;
  const quotation = await getQuotationById(id);
  if (!quotation) notFound();

  const db = getDb();
  const [client] = await db.select().from(clients).where(eq(clients.id, quotation.clientId)).limit(1);
  if (!client) notFound();

  const [business] = await db.select().from(businessSettings).limit(1);
  if (!business) notFound();

  const docDetails = (business.documentDetails ?? {}) as Record<string, unknown>;

  const pdfData = {
    quotationNumber: quotation.quotationNumber,
    issueDate: quotation.issueDate,
    validUntil: quotation.validUntil ?? undefined,
    clientName: client.fullName,
    clientPhone: client.phone ?? "",
    clientEmail: client.email ?? "",
    lineItems: quotation.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      discountCents: item.discountCents,
      totalCents: item.quantity * item.unitPriceCents - item.discountCents,
    })),
    subtotalCents: quotation.subtotalCents,
    discountCents: quotation.discountCents,
    totalCents: quotation.totalCents,
    notes: quotation.notes ?? "",
    terms: quotation.terms ?? "",
  };

  const businessData = {
    businessName: business.businessName,
    address: business.address,
    phone: business.telephone,
    email: business.email,
    registrationNumber: docDetails.registrationNumber as string | undefined,
    taxNumber: docDetails.taxNumber as string | undefined,
    bankingDetails: docDetails.bankingDetails as string | undefined,
    footerMessage: docDetails.footerMessage as string | undefined,
    signatureName: docDetails.signatureName as string | undefined,
    signatureRole: docDetails.signatureRole as string | undefined,
  };

  const pdfBuffer = await generateQuotationPdf(pdfData, businessData);

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quotation.quotationNumber}.pdf"`,
    },
  });
}
