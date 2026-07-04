"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Client {
  id: string;
  fullName: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalCents: number;
  amountPaidCents: number;
  balanceCents: number;
}

export function InvoiceSelector({
  clients,
  preselectedInvoiceId,
}: {
  clients: Client[];
  preselectedInvoiceId?: string;
}) {
  const [clientId, setClientId] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(preselectedInvoiceId ?? "");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- async data fetching on client change with cleanup */
    if (!clientId) {
      setInvoices([]);
      setSelectedInvoiceId("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/invoices/unpaid?clientId=${encodeURIComponent(clientId)}`)
      .then((res) => (res.ok ? res.json() : { invoices: [] }))
      .then((data) => {
        if (cancelled) return;
        const fetched = data.invoices ?? [];
        setInvoices(fetched);
        if (preselectedInvoiceId && fetched.some((inv: Invoice) => inv.id === preselectedInvoiceId)) {
          setSelectedInvoiceId(preselectedInvoiceId);
        }
      })
      .catch(() => {
        if (!cancelled) setInvoices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [clientId, preselectedInvoiceId]);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  return (
    <>
      <div>
        <label htmlFor="clientId" className="mb-2 block text-sm font-semibold">Client</label>
        <select
          id="clientId"
          name="clientId"
          required
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setSelectedInvoiceId("");
          }}
          className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="invoiceId" className="mb-2 block text-sm font-semibold">
          Linked Invoice {clientId ? "(optional)" : ""}
        </label>
        <input type="hidden" name="invoiceId" value={selectedInvoiceId} />
        {clientId ? (
          loading ? (
            <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading invoices...
            </div>
          ) : invoices.length > 0 ? (
            <div className="space-y-1.5">
              {invoices.map((inv) => {
                const isSelected = selectedInvoiceId === inv.id;
                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setSelectedInvoiceId(isSelected ? "" : inv.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-surface-muted"
                    }`}
                  >
                    <div>
                      <span className="font-medium">{inv.invoiceNumber}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        Balance: N${(inv.balanceCents / 100).toFixed(2)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Total: N${(inv.totalCents / 100).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="flex h-11 items-center rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
              No unpaid invoices for this client.
            </p>
          )
        ) : (
          <p className="flex h-11 items-center rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
            Select a client to see unpaid invoices.
          </p>
        )}
      </div>

      {selectedInvoice && (
        <div className="rounded-xl bg-surface-muted p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">N${(selectedInvoice.totalCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Already paid</span>
            <span className="font-medium text-green-600">N${(selectedInvoice.amountPaidCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-semibold">Remaining balance</span>
            <span className="font-semibold text-primary">N${(selectedInvoice.balanceCents / 100).toFixed(2)}</span>
          </div>
        </div>
      )}
    </>
  );
}
