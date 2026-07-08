import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePermission } from "@/auth/session";
import { DocumentsFilters } from "@/components/DocumentsFilters";
import { DocumentsForm } from "@/components/DocumentsForm";
import { PaymentPanel } from "@/components/PaymentPanel";
import { getClients } from "@/dashboard/data";
import { DashboardShell } from "@/dashboard/shell";
import { fmtCents } from "@/documents/calculate";
import { listUnifiedDocuments } from "@/lib/models/document";
import { Badge, LinkButton } from "@/ui/components";
import { Pagination } from "@/ui/pagination";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Documents — Swakop Wellness Centre",
};

function documentHref(row: {
  type: string;
  sourceInvoiceId: string | null;
  sourceQuotationId: string | null;
  sourceReceiptId: string | null;
}) {
  if (row.type === "invoice" && row.sourceInvoiceId) return `/dashboard/invoices/${row.sourceInvoiceId}`;
  if (row.type === "quotation" && row.sourceQuotationId) return `/dashboard/quotations/${row.sourceQuotationId}`;
  if (row.type === "receipt" && row.sourceReceiptId) return `/dashboard/receipts/${row.sourceReceiptId}`;
  return "/dashboard/documents";
}

function pdfHref(row: {
  type: string;
  sourceInvoiceId: string | null;
  sourceQuotationId: string | null;
  sourceReceiptId: string | null;
}) {
  if (row.type === "invoice" && row.sourceInvoiceId) return `/api/invoices/${row.sourceInvoiceId}/pdf`;
  if (row.type === "quotation" && row.sourceQuotationId) return `/api/quotations/${row.sourceQuotationId}/pdf`;
  if (row.type === "receipt" && row.sourceReceiptId) return `/api/receipts/${row.sourceReceiptId}/pdf`;
  return null;
}

function statusVariant(status: string) {
  if (["paid", "accepted", "active"].includes(status)) return "success" as const;
  if (["issued", "partially_paid", "draft"].includes(status)) return "primary" as const;
  if (["overdue", "rejected"].includes(status)) return "warning" as const;
  if (["voided", "cancelled"].includes(status)) return "danger" as const;
  return "muted" as const;
}

export default async function DocumentsPage(props: {
  searchParams: Promise<{ page?: string; type?: string; status?: string; from?: string; to?: string; q?: string; invoiceId?: string }>;
}) {
  await requirePermission("financials:view");
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const pageSize = 25;

  const [{ rows, total }, { rows: clients }] = await Promise.all([
    listUnifiedDocuments({
      page,
      pageSize,
      type: searchParams.type,
      status: searchParams.status,
      from: searchParams.from,
      to: searchParams.to,
      q: searchParams.q,
    }),
    getClients(1, 250),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Finance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Documents</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Unified register for quotations, invoices, receipts, and booking-linked payments.</p>
        </div>
        <LinkButton href="/dashboard/payments" variant="secondary" size="sm">Payment Register</LinkButton>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <DocumentsForm
          clients={clients}
          initialType={["quotation", "invoice", "receipt"].includes(searchParams.type ?? "") ? (searchParams.type as "quotation" | "invoice" | "receipt") : "quotation"}
        />
        <PaymentPanel invoiceId={searchParams.invoiceId ?? null} />
      </div>

      <Suspense fallback={null}>
        <DocumentsFilters />
      </Suspense>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Issue Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = documentHref(row);
              const pdf = pdfHref(row);
              return (
                <tr key={row.id} className="border-t border-border hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <Link href={href} className="font-semibold text-primary hover:underline">
                      {row.documentNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.clientName}</td>
                  <td className="px-4 py-3">{row.bookingReference ?? "Manual"}</td>
                  <td className="px-4 py-3 capitalize">{row.type}</td>
                  <td className="px-4 py-3">{row.issueDate.toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(row.status)} className="capitalize">{row.status.replaceAll("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtCents(row.totalCents)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={href} className="font-semibold text-primary hover:underline">Preview</Link>
                      {pdf ? <a href={pdf} target="_blank" className="font-semibold text-primary hover:underline">PDF</a> : null}
                      {row.type === "invoice" && row.sourceInvoiceId && row.balanceCents > 0 ? (
                        <Link href={`/dashboard/documents?invoiceId=${row.sourceInvoiceId}`} className="font-semibold text-primary hover:underline">
                          Pay
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">No documents found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/documents" />
    </DashboardShell>
  );
}
