/** 
 * DocumentPreview — a shared React component that mirrors the PDF document layout.
 * Used in invoice, quotation, and receipt detail pages for live preview matching the PDF.
 */
import type { ReactNode } from "react";

interface LineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  totalCents: number;
}

interface DocumentPreviewProps {
  type: "INVOICE" | "QUOTATION" | "RECEIPT";
  documentNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  lineItems: LineItem[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  notes: string;
  terms: string;
  bankingDetails?: string;
  /** Right-side label-value pairs for dates section */
  dates?: Array<{ label: string; value: string }>;
  /** Bottom action buttons that appear below the preview */
  actions?: ReactNode;
}

function fmt(cents: number): string {
  return `N$${(cents / 100).toFixed(2)}`;
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 150" className={className} aria-hidden="true">
      <path d="M158.5,89.78c2.06-3.84,6.09-5.75,10.19-4.62l5.01,1.38c3.07.85,6.53.8,6.69-1.39s-.09-4.08-.68-6.05c-1.9-6.31,3.9-8.62-.43-12.33l-2.19-1.88c-.78-.67-.71-2.07-.04-2.8l2.67-2.89c.7-.76.46-1.8-.3-2.4-4.48-3.53-9.34-5.69-14.72-7.71l4.9-.51c-.56-1.93-1.31-3.86-2.38-5.67l-3.87-6.57-6.37-14.34c2,2.08,3.21,4.45,4.48,6.96,2.27,4.49,4.65,8.69,7.3,12.97,1.58,2.54,2.75,5.23,4.64,7.55,3.3,4.03,8.29,5.68,8.78,7.65.18.73-.09,1.92-.61,2.43l-2.53,2.51c-.3.3-.91,1.12-.76,1.51s.66,1.02,1.01,1.45c3.06,1.39,4.17,4.53,2.78,7.51-2.33,4.68,1.2,7.13.8,13.26-.37,5.55-8.26,3.73-13.67,2.4-3.35-.82-6.52.23-8.31,3.23-2.9,4.85-2.81,10.58-.43,15.66-1.22-1.09-1.95-2.23-2.7-3.48-1.76-4.49-1.6-9.46.75-13.83Z" fill="currentColor" />
    </svg>
  );
}

export function DocumentPreview({
  type,
  documentNumber,
  clientName,
  clientPhone,
  clientEmail,
  lineItems,
  subtotalCents,
  discountCents,
  taxCents,
  totalCents,
  paidCents,
  balanceCents,
  notes,
  terms,
  bankingDetails,
  dates,
  actions,
}: DocumentPreviewProps) {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm print:shadow-none print:border-0">
      {/* Paper-like container */}
      <div className="mx-auto max-w-[210mm] p-6 sm:p-8 print:p-0">
        {/* Watermark */}
        <div className="absolute right-4 top-4 opacity-[0.035] text-primary pointer-events-none select-none">
          <LeafIcon className="h-32 w-32" />
        </div>

        {/* Header: Business info + Title */}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Swakop Wellness Centre</p>
            <p>Shop 4, Sam Nujoma Avenue</p>
            <p>Swakopmund, Namibia</p>
            <p>+264 81 123 4567</p>
            <p>info@swakopwellness.com</p>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{type}</h2>
            <p className="text-sm text-muted-foreground">{documentNumber}</p>
          </div>
        </div>

        {/* Green divider */}
        <div className="my-4 border-t-2 border-primary/60" />

        {/* Dates + Client */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            {dates?.map((d) => (
              <p key={d.label}>
                <span className="font-semibold text-foreground">{d.label}: </span>
                <span className="text-muted-foreground">{d.value}</span>
              </p>
            ))}
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Bill To:</p>
            <p className="text-muted-foreground">{clientName}</p>
            {clientPhone && <p className="text-muted-foreground">{clientPhone}</p>}
            {clientEmail && <p className="text-muted-foreground">{clientEmail}</p>}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mt-6 overflow-x-auto">
          {lineItems.length === 0 ? (
            <div className="rounded-xl bg-surface-muted p-6 text-center text-sm text-muted-foreground">
              No line items added yet.
            </div>
          ) : (
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-surface-muted border-b border-border">
                <th className="py-2 pr-2 font-semibold">Description</th>
                <th className="py-2 px-2 text-right font-semibold">Qty</th>
                <th className="py-2 px-2 text-right font-semibold">Unit Price</th>
                {type !== "RECEIPT" && (
                  <th className="py-2 px-2 text-right font-semibold">Discount</th>
                )}
                <th className="py-2 pl-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineItems.map((item, i) => (
                <tr key={i} className="hover:bg-surface-muted/30">
                  <td className="py-2 pr-2">{item.description}</td>
                  <td className="py-2 px-2 text-right">{item.quantity}</td>
                  <td className="py-2 px-2 text-right">{fmt(item.unitPriceCents)}</td>
                  {type !== "RECEIPT" && (
                    <td className="py-2 px-2 text-right text-muted-foreground">
                      {item.discountCents > 0 ? fmt(item.discountCents) : "\u2014"}
                    </td>
                  )}
                  <td className="py-2 pl-2 text-right font-medium">
                    {fmt(item.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {/* Totals */}
        <div className="mt-4 ml-auto w-full max-w-[260px] space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{fmt(subtotalCents)}</span>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-red-600">-{fmt(discountCents)}</span>
            </div>
          )}
          {taxCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{fmt(taxCents)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-1 font-semibold">
            <span>Total</span>
            <span>{fmt(totalCents)}</span>
          </div>
          {paidCents > 0 && (
            <div className="flex justify-between text-primary">
              <span>Amount Paid</span>
              <span>-{fmt(paidCents)}</span>
            </div>
          )}
          {balanceCents > 0 && (
            <>
              <div className="border-t border-border" />
              <div className="flex justify-between bg-surface-muted px-2 py-1.5 rounded-lg font-semibold">
                <span>Balance Due</span>
                <span>{fmt(balanceCents)}</span>
              </div>
            </>
          )}
        </div>

        {/* Notes, Terms, Banking */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {notes && (
            <div className="rounded-lg border border-border bg-surface-muted/30 p-3 text-center text-xs">
              <div className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted">
                <span className="text-[10px] text-primary font-bold">N</span>
              </div>
              <p className="mb-1 text-xs font-semibold text-foreground">Notes</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{notes}</p>
            </div>
          )}
          {terms && (
            <div className="rounded-lg border border-border bg-surface-muted/30 p-3 text-center text-xs">
              <div className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted">
                <span className="text-[10px] text-primary font-bold">T</span>
              </div>
              <p className="mb-1 text-xs font-semibold text-foreground">Terms</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{terms}</p>
            </div>
          )}
          {bankingDetails && (
            <div className="rounded-lg border border-border bg-surface-muted/30 p-3 text-center text-xs">
              <div className="mx-auto mb-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted">
                <span className="text-[10px] text-primary font-bold">$</span>
              </div>
              <p className="mb-1 text-xs font-semibold text-foreground">Banking Details</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{bankingDetails}</p>
            </div>
          )}
        </div>

        {/* Thank you footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px flex-1 bg-primary/20 max-w-20" />
            <LeafIcon className="h-4 w-4 text-primary/40" />
            <div className="h-px flex-1 bg-primary/20 max-w-20" />
          </div>
          <p className="font-serif italic text-primary">Thank you for choosing Swakop Wellness Centre.</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Your wellness. Our priority.</p>
        </div>

        {/* Actions */}
        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}
