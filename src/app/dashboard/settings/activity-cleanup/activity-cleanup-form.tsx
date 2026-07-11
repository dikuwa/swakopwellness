"use client";

import { useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Download, Loader2, Trash2, FileDown, ShieldAlert, RefreshCw, CheckCircle2 } from "lucide-react";
import type { ActivityCleanupPreview } from "@/cleanup/actions";

const CONFIRMATION_PHRASE = "RESET ALL ACTIVITY";
const EXPIRY_MINUTES = 30;

function formatCount(value: number) {
  return new Intl.NumberFormat("en-NA").format(value);
}

type ExportState = {
  runId: string;
  cutoffAt: string;
  exportedCounts: Record<string, number>;
};

type ExecuteState = {
  deleted: Record<string, number>;
  total: number;
};

export function ActivityCleanupForm({ initialPreview }: { initialPreview: ActivityCleanupPreview }) {
  const [preview, setPreview] = useState<ActivityCleanupPreview>(initialPreview);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportState | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState<ExecuteState | null>(null);
  const [confirmation, setConfirmation] = useState("");

  const refreshPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/admin/cleanup/preview");
      if (!res.ok) {
        toast.error("Failed to refresh preview counts.");
        return;
      }
      const data: ActivityCleanupPreview = await res.json();
      setPreview(data);
    } catch {
      toast.error("Network error while refreshing preview.");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportResult(null);
    setExecuteResult(null);
    setConfirmation("");

    try {
      const res = await fetch("/api/admin/cleanup/export", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed." }));
        toast.error(err.error ?? "Export failed.");
        return;
      }

      const runId = res.headers.get("X-Cleanup-Run-Id") ?? "";
      const cutoffAt = res.headers.get("X-Cleanup-Cutoff") ?? "";
      const countsHeader = res.headers.get("X-Cleanup-Counts");
      const exportedCounts: Record<string, number> = countsHeader ? JSON.parse(countsHeader) : {};

      // Download the file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-cleanup-${runId.slice(0, 8)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setExportResult({ runId, cutoffAt, exportedCounts });
      toast.success("Export downloaded. You can now execute cleanup.");
    } catch {
      toast.error("Network error during export.");
    } finally {
      setExporting(false);
    }
  }, []);

  const handleExecute = useCallback(async () => {
    if (!exportResult) {
      toast.error("Please export first.");
      return;
    }

    if (confirmation !== CONFIRMATION_PHRASE) {
      toast.error(`Type ${CONFIRMATION_PHRASE} to confirm.`);
      return;
    }

    setExecuting(true);
    try {
      const res = await fetch("/api/admin/cleanup/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: exportResult.runId, confirmation }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Execution failed.");
        return;
      }

      setExecuteResult(data);
      toast.success("Activity cleanup complete.");
      setConfirmation("");

      // Refresh preview counts and dashboard
      await refreshPreview();
    } catch {
      toast.error("Network error during execution.");
    } finally {
      setExecuting(false);
    }
  }, [exportResult, confirmation, refreshPreview]);

  // Check if export has expired
  const isExpired = useMemo(
    () => !!(exportResult && !executeResult && new Date(exportResult.cutoffAt).getTime() + EXPIRY_MINUTES * 60 * 1000 < Date.now()),
    [exportResult, executeResult],
  );

  return (
    <div className="mt-8 space-y-6">
      {/* Warning banner */}
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold">Owner-only activity cleanup</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              This permanently deletes operational activity records: chat conversations and messages, notifications, and activity log entries.
              Services, content, settings, users, media uploads, and financial records are preserved.
            </p>
          </div>
        </div>
      </div>

      {/* Success summary */}
      {executeResult && (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
            <div>
              <h3 className="text-base font-semibold text-success">Cleanup completed</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCount(executeResult.total)} records deleted across {Object.keys(executeResult.deleted).length} categories.
              </p>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {Object.entries(executeResult.deleted).map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg bg-surface px-3 py-1.5 text-xs">
                    <span className="font-medium text-muted-foreground">
                      {key.replace(/([A-Z])/g, " $1").trim()}:
                    </span>
                    <span className="font-semibold text-foreground">{formatCount(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Preview */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Step 1: Preview records</h3>
            <button
              type="button"
              onClick={refreshPreview}
              disabled={previewLoading}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-60"
              aria-label="Refresh counts"
            >
              <RefreshCw className={`h-3 w-3 ${previewLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">
            {formatCount(preview.total)} total records
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {preview.models.map((model) => (
            <div
              key={model.key}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
            >
              <span className="text-sm font-medium text-foreground">{model.label}</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {formatCount(model.count)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Export */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-base font-semibold">Step 2: Export backup</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Download an Excel workbook with all current activity records. A cutoff timestamp is recorded so only records up to this point can be deleted.
        </p>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" aria-hidden="true" />
              {exportResult ? "Export again" : "Export activity records"}
            </>
          )}
        </button>

        {exportResult && (
          <div className={`mt-4 rounded-xl border p-4 ${isExpired ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"}`}>
            <div className="flex items-start gap-2">
              {isExpired ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              )}
              <div className="min-w-0 text-sm">
                <p className={`font-semibold ${isExpired ? "text-warning" : "text-success"}`}>
                  {isExpired ? "Export expired" : "Export ready"}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Run ID: <span className="font-mono text-xs">{exportResult.runId}</span>
                </p>
                <p className="text-muted-foreground">
                  Cutoff: {new Date(exportResult.cutoffAt).toLocaleString()}
                </p>
                <p className="text-muted-foreground">
                  {formatCount(Object.values(exportResult.exportedCounts).reduce((a, b) => a + b, 0))} records exported
                </p>
                {isExpired && (
                  <p className="mt-1 text-warning">
                    Exports expire after {EXPIRY_MINUTES} minutes. Please export again to proceed.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Execute */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-base font-semibold">Step 3: Execute cleanup</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Type <strong className="text-foreground">{CONFIRMATION_PHRASE}</strong> below and confirm to permanently delete all exported records.
          This action is irreversible.
        </p>

        <div className="mt-4">
          <label htmlFor="confirmation" className="mb-1.5 block text-sm font-medium text-muted-foreground">
            Type confirmation phrase
          </label>
          <input
            id="confirmation"
            type="text"
            autoComplete="off"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={executing || !exportResult || isExpired}
            placeholder={CONFIRMATION_PHRASE}
            className="h-11 w-full max-w-md rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-3 focus:ring-primary/10 disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          onClick={handleExecute}
          disabled={executing || !exportResult || isExpired || confirmation !== CONFIRMATION_PHRASE}
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {executing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cleaning up...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete all activity records
            </>
          )}
        </button>

        {!exportResult && !executeResult && (
          <p className="mt-2 text-xs text-muted-foreground">Export activity records first to enable cleanup.</p>
        )}
      </div>

      {/* Preserved data summary */}
      <details className="rounded-2xl border border-border bg-surface-muted/50">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <FileDown className="h-4 w-4" aria-hidden="true" />
          What's preserved
        </summary>
        <div className="border-t border-border px-5 py-4">
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Services, categories, FAQs, screening questions, predefined items
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Blog posts and public site content (policies, FAQs)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Business, communication, booking, and document settings
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Uploaded media (images stored in R2)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Admin accounts, roles, permissions, and active sessions
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Financial records (bookings, invoices, payments, receipts, quotations, documents)
            </li>
          </ul>
        </div>
      </details>
    </div>
  );
}
