import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { quotationLineItems, quotations } from "@/db/schema";
import { getClients, getBookableServicesForManualUse } from "@/dashboard/data";
import { QuotationEditForm } from "./quotation-edit-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Quotation — Dashboard",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuotationPage({ params }: PageProps) {
  await requirePermission("documents:create");
  const db = getDb();
  const { id } = await params;

  const [quotation] = await db
    .select()
    .from(quotations)
    .where(eq(quotations.id, id))
    .limit(1);

  if (!quotation) notFound();

  // Only draft quotations can be edited
  if (quotation.status !== "draft") {
    redirect(`/dashboard/quotations/${id}`);
  }

  const lineItems = await db
    .select()
    .from(quotationLineItems)
    .where(eq(quotationLineItems.quotationId, id))
    .orderBy(asc(quotationLineItems.sortOrder));

  const [{ rows: clients }, services] = await Promise.all([
    getClients(),
    getBookableServicesForManualUse(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <QuotationEditForm
        clients={clients}
        services={services}
        quotationId={id}
        initialClientId={quotation.clientId}
        initialIssueDate={quotation.issueDate.toISOString().slice(0, 10)}
        initialValidUntil={quotation.validUntil ? quotation.validUntil.toISOString().slice(0, 10) : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })()}
        initialNotes={quotation.notes ?? ""}
        initialTerms={quotation.terms ?? ""}
        initialDiscountType={quotation.discountType}
        initialDiscountValue={quotation.discountValue}
        initialLineItems={lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPriceCents: li.unitPriceCents,
          discountCents: li.discountCents,
          serviceId: li.serviceId,
        }))}
      />
    </div>
  );
}
