import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDocumentPredefinedItems } from "@/documents/predefined-items";
import { DocumentPredefinedItemsManager } from "@/components/document-predefined-items-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Additional Items — Dashboard",
};

export default async function ServiceAdditionalItemsPage() {
  await requirePermission("services:manage");
  const predefinedItems = await getDocumentPredefinedItems();
  const activeItems = predefinedItems.filter((item) => item.active).length;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Services</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Additional Items</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Create and manage reusable charges for generated invoices, quotations, and receipts.
          </p>
        </div>
        <Link
          href="/dashboard/services"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Services
        </Link>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-3 max-w-lg">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FilePlus2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saved</p>
            <p className="text-xl font-bold tracking-tight mt-0.5">{predefinedItems.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <span className="text-lg font-bold">{activeItems}</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active</p>
            <p className="text-sm font-bold tracking-tight mt-0.5">Visible in documents</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <DocumentPredefinedItemsManager predefinedItems={predefinedItems} />
      </div>
    </DashboardShell>
  );
}
