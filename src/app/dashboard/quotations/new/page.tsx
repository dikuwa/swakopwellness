import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { getClients, getBookableServicesForManualUse } from "@/dashboard/data";
import { QuotationForm } from "./quotation-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Quotation — Dashboard",
};

export default async function NewQuotationPage() {
  await requirePermission("documents:create");
  const [{ rows: clients }, services] = await Promise.all([
    getClients(),
    getBookableServicesForManualUse(),
  ]);

  return <QuotationForm clients={clients} services={services} />;
}
