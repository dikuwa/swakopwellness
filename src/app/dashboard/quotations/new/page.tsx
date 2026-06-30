import { requirePermission } from "@/auth/session";
import { getClients, getBookableServicesForManualUse } from "@/dashboard/data";
import { QuotationForm } from "./quotation-form";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  await requirePermission("documents:create");
  const [clients, services] = await Promise.all([
    getClients(),
    getBookableServicesForManualUse(),
  ]);

  return <QuotationForm clients={clients} services={services} />;
}
