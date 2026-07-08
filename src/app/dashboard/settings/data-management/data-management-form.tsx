"use client";

import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, DatabaseZap, Loader2, RotateCcw } from "lucide-react";
import { clearSelectedData, type CleanupResult, type DataManagementCounts } from "@/data-management/actions";

const confirmationPhrase = "CLEAR SWAKOP DATA";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-NA").format(value);
}

function deletedSummary(result: CleanupResult["deleted"]) {
  if (!result) return "";
  const entries = Object.entries(result).filter(([, value]) => typeof value === "number" && value > 0);
  if (entries.length === 0) return "No matching records needed clearing.";
  return entries
    .map(([key, value]) => `${key.replace(/([A-Z])/g, " $1").toLowerCase()}: ${value}`)
    .join(", ");
}

export function DataManagementForm({ counts }: { counts: DataManagementCounts }) {
  const [state, action, isPending] = useActionState(
    async (_previous: CleanupResult | null, formData: FormData) => clearSelectedData(formData),
    null,
  );

  useEffect(() => {
    if (state?.ok) toast.success("Data cleanup complete");
    if (state?.ok === false && state.error) toast.error(state.error);
  }, [state]);

  const groups = [
    {
      name: "operations",
      title: "Operational records",
      description: "Bookings, booking answers/history, follow-ups, and chat conversations.",
      count: counts.bookings + counts.followUps + counts.chatConversations,
      detail: `${formatCount(counts.bookings)} bookings, ${formatCount(counts.followUps)} follow-ups, ${formatCount(counts.chatConversations)} chats`,
    },
    {
      name: "finance",
      title: "Finance and documents",
      description: "Unified documents, invoices, quotations, receipts, payments, and their line items.",
      count: counts.documents + counts.invoices + counts.quotations + counts.receipts + counts.payments,
      detail: `${formatCount(counts.documents)} documents, ${formatCount(counts.invoices)} invoices, ${formatCount(counts.quotations)} quotes, ${formatCount(counts.receipts)} receipts, ${formatCount(counts.payments)} payments`,
    },
    {
      name: "notifications",
      title: "Notifications",
      description: "Dashboard notifications for all users.",
      count: counts.notifications,
      detail: `${formatCount(counts.notifications)} notifications`,
    },
    {
      name: "activity",
      title: "Activity logs",
      description: "Audit/activity log rows. If unchecked, this cleanup will leave a new audit entry.",
      count: counts.activityLogs,
      detail: `${formatCount(counts.activityLogs)} activity rows`,
    },
    {
      name: "orphanClients",
      title: "Orphan clients",
      description: "Only clients with no remaining bookings, finance records, follow-ups, or chats.",
      count: counts.orphanClients,
      detail: `${formatCount(counts.orphanClients)} removable clients`,
    },
  ];

  return (
    <form action={action} className="mt-8 space-y-6">
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold">Owner-only clean slate tools</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              These actions permanently remove selected operational records. Users, services, public content, settings, media, and roles are kept intact.
            </p>
          </div>
        </div>
      </div>

      {state?.ok === false && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {state.error}
        </div>
      )}

      {state?.ok && (
        <div className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success" role="status">
          Cleanup complete. {deletedSummary(state.deleted)}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <label
            key={group.name}
            className="flex cursor-pointer gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-muted/60"
          >
            <input
              type="checkbox"
              name={group.name}
              className="mt-1 h-4 w-4 rounded border-border accent-primary"
            />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{group.title}</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {formatCount(group.count)}
                </span>
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">{group.description}</span>
              <span className="mt-2 block text-xs text-muted-foreground">{group.detail}</span>
            </span>
          </label>
        ))}
      </div>

      <label className="flex cursor-pointer gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-muted/60">
        <input type="checkbox" name="resetDocumentSequences" className="mt-1 h-4 w-4 rounded border-border accent-primary" />
        <span>
          <span className="flex items-center gap-2 font-semibold">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset document counters
          </span>
          <span className="mt-1 block text-sm leading-6 text-muted-foreground">
            Sets quotation, invoice, receipt, and unified document counters back to 1. Use this only when clearing finance test records.
          </span>
        </span>
      </label>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <label htmlFor="confirmation" className="mb-1.5 block text-sm font-semibold">
          Type {confirmationPhrase} to confirm
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="text"
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-3 focus:ring-primary/10"
        />
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <DatabaseZap className="h-4 w-4" aria-hidden="true" />}
          {isPending ? "Clearing..." : "Clear selected data"}
        </button>
      </div>
    </form>
  );
}
