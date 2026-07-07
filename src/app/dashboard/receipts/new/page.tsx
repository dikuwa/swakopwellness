import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getClients, getBookableServicesForManualUse } from "@/dashboard/data";
import { getInvoiceById } from "@/dashboard/data";
import { ReceiptForm } from "./receipt-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Receipt — Dashboard",
};

export default async function NewReceiptPage(props: { searchParams: Promise<{ invoice_id?: string }> }) {
  await requirePermission("documents:create");
  const [{ rows: clients }, services] = await Promise.all([
    getClients(),
    getBookableServicesForManualUse(),
  ]);

  const searchParams = await props.searchParams;

  // If invoice_id is provided, fetch invoice details for auto-populate
  let initialInvoiceId: string | undefined;
  let initialClientId: string | undefined;
  let initialLineItems: { description: string; quantity: number; unitPriceCents: number; discountCents: number; serviceId: string | null }[] | undefined;
  let initialAmountCents: number | undefined;

  if (searchParams.invoice_id) {
    initialInvoiceId = searchParams.invoice_id;
    try {
      const invoice = await getInvoiceById(searchParams.invoice_id);
      if (invoice) {
        initialClientId = invoice.clientId;
        initialAmountCents = invoice.balanceCents;
        initialLineItems = invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountCents: item.discountCents,
          serviceId: item.serviceId,
        }));
      }
    } catch {
      // Silently ignore — invoice may not exist or be accessible
    }
  }

  return (
    <DashboardShell>
      <ReceiptForm
        clients={clients}
        services={services}
        initialInvoiceId={initialInvoiceId}
        initialClientId={initialClientId}
        initialLineItems={initialLineItems}
        initialAmountCents={initialAmountCents}
      />
    </DashboardShell>
  );
}
