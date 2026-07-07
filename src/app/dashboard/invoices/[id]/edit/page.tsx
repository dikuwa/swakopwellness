import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { invoiceLineItems, invoices, services, serviceCategories } from "@/db/schema";
import { getClients, getBookableServicesForManualUse } from "@/dashboard/data";
import { InvoiceEditForm } from "./invoice-edit-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Invoice — Dashboard",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: PageProps) {
  await requirePermission("documents:create");
  const db = getDb();
  const { id } = await params;

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoice) notFound();

  // Only draft invoices can be edited
  if (invoice.status !== "draft") {
    redirect(`/dashboard/invoices/${id}`);
  }

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id))
    .orderBy(asc(invoiceLineItems.sortOrder));

  const [{ rows: clients }, services] = await Promise.all([
    getClients(),
    getBookableServicesForManualUse(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <InvoiceEditForm
        clients={clients}
        services={services}
        invoiceId={id}
        initialClientId={invoice.clientId}
        initialIssueDate={invoice.issueDate.toISOString().slice(0, 10)}
        initialDueDate={invoice.dueDate.toISOString().slice(0, 10)}
        initialNotes={invoice.notes ?? ""}
        initialTerms={invoice.terms ?? ""}
        initialDiscountType={invoice.discountType}
        initialDiscountValue={invoice.discountValue}
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
