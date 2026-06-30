import { requirePermission } from "@/auth/session";
import { getClients, getBookableServicesForManualUse } from "@/dashboard/data";
import { InvoiceForm } from "./invoice-form";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  await requirePermission("documents:create");
  const [clients, services] = await Promise.all([
    getClients(),
    getBookableServicesForManualUse(),
  ]);

  return <InvoiceForm clients={clients} services={services} />;
}
