import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getClients, getBookableServicesForManualUse } from "@/dashboard/data";
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

  return (
    <DashboardShell>
      <ReceiptForm
        clients={clients}
        services={services}
        initialInvoiceId={searchParams.invoice_id}
      />
    </DashboardShell>
  );
}
