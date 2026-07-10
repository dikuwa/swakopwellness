"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  ArrowRight, CheckCircle2, Loader2, Store, MessageSquare, CalendarRange, FileText,
} from "lucide-react";
import { Select, TimePicker, Checkbox } from "@/ui/components";
import { updateBusinessSettings, updateCommunicationSettings, updateBookingRules, updateDocumentSequence } from "@/settings/actions";

const TABS = [
  { id: "general", label: "General", icon: Store },
  { id: "communication", label: "Communication", icon: MessageSquare },
  { id: "booking", label: "Booking", icon: CalendarRange },
  { id: "documents", label: "Documents", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];
type SaveAction = (fd: FormData) => Promise<{ ok: boolean; error?: string }>;

interface MediaAsset {
  id: string;
  storageKey: string;
  publicUrl: string | null;
  altText: string | null;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
}

export function SettingsTabs({
  businessSettings: bs,
  communicationSettings: cs,
  bookingRules: br,
  documentSequences: seqs,
  mediaAssets,
}: {
  businessSettings: {
    id: string; businessName: string; address: string; telephone: string; email: string;
    operatingHours: string; appointmentModel: string; currencyCode: string; currencySymbol: string;
    medicalDisclaimer: string; technologyImageId: string | null; documentDetails: Record<string, unknown>;
  } | null;
  communicationSettings: {
    id: string; enableCalls: boolean; mainPhone: string; enableEmailContact: boolean;
    businessEmail: string; bookingNotificationEmail: string | null; acknowledgementEmail: string | null;
    replyToEmail: string | null; enableWhatsapp: boolean; whatsappNumber: string | null;
    whatsappDefaultMessage: string | null;
  } | null;
  bookingRules: {
    id: string; openingTime: string; closingTime: string; timezone: string;
    requestMode: string; duplicateWindowMinutes: number;
  } | null;
  documentSequences: {
    id: string; documentType: string; prefix: string; nextNumber: number; padding: number;
  }[];
  mediaAssets: MediaAsset[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [saving, setSaving] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openingTime, setOpeningTime] = useState(br?.openingTime ?? "08:00");
  const [closingTime, setClosingTime] = useState(br?.closingTime ?? "17:00");
  const [requestMode, setRequestMode] = useState(br?.requestMode ?? "booking_request");
  const [technologyImageId, setTechnologyImageId] = useState(bs?.technologyImageId ?? "");

  const isSaving = (label: string) => saving === label;

  const handleAction = async (
    action: SaveAction,
    formData: FormData,
    label: string,
    successMessage?: string,
  ) => {
    const message = successMessage ?? "Changes saved.";
    const toastId = `settings-${label}`;
    try {
      setSaving(label);
      setSavedLabel(null);
      setError(null);
      setSuccess(null);
      toast.loading("Saving settings...", { id: toastId });
      const result = await action(formData);
      if (!result.ok) {
        const actionError = result.error ?? "Save failed. Please try again.";
        setError(actionError);
        toast.error(actionError, { id: toastId });
      } else {
        setSavedLabel(label);
        setSuccess(message);
        toast.success(message, { id: toastId });
      }
    } catch {
      const fallback = "Something went wrong while saving. Please try again.";
      setError(fallback);
      toast.error(fallback, { id: toastId });
    } finally {
      setSaving(null);
    }
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
    action: SaveAction,
    label: string,
    successMessage?: string,
  ) => {
    event.preventDefault();
    void handleAction(action, new FormData(event.currentTarget), label, successMessage);
  };

  const saveButtonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60";
  const saveRowClass = "flex flex-wrap items-center gap-4";

  const renderSaveStatus = (label: string, pendingText = "Saving changes...") => (
    <div className="min-h-5 text-sm" aria-live="polite">
      {isSaving(label) ? (
        <span className="inline-flex items-center gap-2 font-medium text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {pendingText}
        </span>
      ) : success && savedLabel === label ? (
        <span className="inline-flex items-center gap-2 font-medium text-success" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {success}
        </span>
      ) : null}
    </div>
  );

  const renderSubmitButton = (label: string, idleText: string) => (
    <button
      type="submit"
      disabled={isSaving(label)}
      aria-busy={isSaving(label)}
      className={saveButtonClass}
    >
      {isSaving(label) ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Saving...
        </>
      ) : idleText}
    </button>
  );

  return (
    <div className="mt-8">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Settings tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "border border-b-0 border-border bg-surface text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-muted"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {success}
        </div>
      )}

      {/* Tab panels */}
      <div className="mt-6" role="tabpanel" aria-label={TABS.find((t) => t.id === activeTab)?.label}>
        {/* ─── General ─── */}
        {activeTab === "general" && bs && (
          <form
            onSubmit={(event) => handleSubmit(event, updateBusinessSettings, "general")}
            className="space-y-5"
          >
            <fieldset disabled={isSaving("general")} className="space-y-5 disabled:opacity-70">
            <div className="rounded-xl border border-border p-5 space-y-4">
              <h2 className="text-lg font-semibold">Business Details</h2>
              <div>
                <label htmlFor="bs-name" className="mb-1.5 block text-sm font-medium">Business Name</label>
                <input id="bs-name" name="businessName" defaultValue={bs.businessName} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
              </div>
              <div>
                <label htmlFor="bs-address" className="mb-1.5 block text-sm font-medium">Address</label>
                <textarea id="bs-address" name="address" defaultValue={bs.address} required rows={3} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bs-phone" className="mb-1.5 block text-sm font-medium">Phone</label>
                  <input id="bs-phone" name="telephone" defaultValue={bs.telephone} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                </div>
                <div>
                  <label htmlFor="bs-email" className="mb-1.5 block text-sm font-medium">Email</label>
                  <input id="bs-email" name="email" type="email" defaultValue={bs.email} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                </div>
              </div>
              <div>
                <label htmlFor="bs-hours" className="mb-1.5 block text-sm font-medium">Operating Hours</label>
                <textarea id="bs-hours" name="operatingHours" defaultValue={bs.operatingHours} required rows={2} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
              </div>
              <div>
                <label htmlFor="bs-model" className="mb-1.5 block text-sm font-medium">Appointment Model</label>
                <input id="bs-model" name="appointmentModel" defaultValue={bs.appointmentModel} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium">Currency</label>
                  <input value={`${bs.currencyCode} (${bs.currencySymbol})`} readOnly className="h-11 w-full rounded-xl border border-border bg-surface-muted px-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label htmlFor="bs-disclaimer" className="mb-1.5 block text-sm font-medium">Medical Disclaimer</label>
                <textarea id="bs-disclaimer" name="medicalDisclaimer" defaultValue={bs.medicalDisclaimer} required rows={4} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
              </div>
            </div>

            <div className="rounded-xl border border-border p-5 space-y-4">
              <h2 className="text-lg font-semibold">Document Details</h2>
              <p className="text-sm text-muted-foreground">These appear on invoices, receipts, and quotations.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bs-reg" className="mb-1.5 block text-sm font-medium">Registration Number</label>
                  <input id="bs-reg" name="registrationNumber" defaultValue={(bs.documentDetails?.registrationNumber as string) ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                </div>
                <div>
                  <label htmlFor="bs-tax" className="mb-1.5 block text-sm font-medium">Tax Number</label>
                  <input id="bs-tax" name="taxNumber" defaultValue={(bs.documentDetails?.taxNumber as string) ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                </div>
              </div>
              <div>
                <label htmlFor="bs-bank" className="mb-1.5 block text-sm font-medium">Banking Details</label>
                <textarea id="bs-bank" name="bankingDetails" defaultValue={(bs.documentDetails?.bankingDetails as string) ?? ""} rows={3} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bs-signature-name" className="mb-1.5 block text-sm font-medium">Document Signature Name</label>
                  <input
                    id="bs-signature-name"
                    name="signatureName"
                    defaultValue={(bs.documentDetails?.signatureName as string) ?? ""}
                    placeholder="Martin Mukoya"
                    className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="bs-signature-role" className="mb-1.5 block text-sm font-medium">Document Signature Role</label>
                  <input
                    id="bs-signature-role"
                    name="signatureRole"
                    defaultValue={(bs.documentDetails?.signatureRole as string) ?? ""}
                    placeholder="Managing Director"
                    className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bs-footer" className="mb-1.5 block text-sm font-medium">Footer Message</label>
                <textarea id="bs-footer" name="footerMessage" defaultValue={(bs.documentDetails?.footerMessage as string) ?? ""} rows={2} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
              </div>
            </div>

            {/* Technology image picker - simplified inline version */}
            {mediaAssets.length > 0 && (
              <div className="rounded-xl border border-border p-5 space-y-3">
                <h2 className="text-lg font-semibold">Technology Image</h2>
                <p className="text-sm text-muted-foreground">Image shown in the Diacom Technology section on the homepage.</p>
                <Select
                  name="technologyImageId"
                  disabled={isSaving("general")}
                  value={technologyImageId}
                  onChange={setTechnologyImageId}
                  options={[
                    { value: "", label: "None" },
                    ...mediaAssets.map((a) => ({
                      value: a.id,
                      label: a.altText || a.storageKey.split("/").pop() || "Untitled",
                    })),
                  ]}
                  placeholder="None"
                />
              </div>
            )}

            <div className={`${saveRowClass} pt-2`}>
              {renderSubmitButton("general", "Save Changes")}
              {renderSaveStatus("general")}
            </div>
            </fieldset>
          </form>
        )}

        {/* ─── Communication ─── */}
        {activeTab === "communication" && cs && (
          <form
            onSubmit={(event) => handleSubmit(event, updateCommunicationSettings, "comm")}
            className="space-y-6"
          >
            <fieldset disabled={isSaving("comm")} className="space-y-6 disabled:opacity-70">
            <fieldset className="space-y-4 rounded-xl border border-border p-5">
              <legend className="text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">Phone</legend>
              <Checkbox
                defaultChecked={cs.enableCalls}
                name="enableCalls"
                label="Enable calls"
              />
              <div>
                <label htmlFor="cs-phone" className="mb-1.5 block text-sm font-medium">Main Phone</label>
                <input id="cs-phone" name="mainPhone" defaultValue={cs.mainPhone} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-xl border border-border p-5">
              <legend className="text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">Email</legend>
              <Checkbox
                defaultChecked={cs.enableEmailContact}
                name="enableEmailContact"
                label="Enable email contact"
              />
              <div>
                <label htmlFor="cs-email" className="mb-1.5 block text-sm font-medium">Business Email</label>
                <input id="cs-email" name="businessEmail" type="email" defaultValue={cs.businessEmail} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
              </div>
              <div>
                <label htmlFor="cs-notify" className="mb-1.5 block text-sm font-medium">Booking Notification Email</label>
                <input id="cs-notify" name="bookingNotificationEmail" type="email" defaultValue={cs.bookingNotificationEmail ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
              </div>
              <div>
                <label htmlFor="cs-ack" className="mb-1.5 block text-sm font-medium">Acknowledgement Email</label>
                <input id="cs-ack" name="acknowledgementEmail" type="email" defaultValue={cs.acknowledgementEmail ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
              </div>
              <div>
                <label htmlFor="cs-reply" className="mb-1.5 block text-sm font-medium">Reply-To Email</label>
                <input id="cs-reply" name="replyToEmail" type="email" defaultValue={cs.replyToEmail ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-xl border border-border p-5">
              <legend className="text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">WhatsApp</legend>
              <Checkbox
                defaultChecked={cs.enableWhatsapp}
                name="enableWhatsapp"
                label="Enable WhatsApp"
              />
              <div>
                <label htmlFor="cs-wa" className="mb-1.5 block text-sm font-medium">WhatsApp Number</label>
                <input id="cs-wa" name="whatsappNumber" defaultValue={cs.whatsappNumber ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
              </div>
              <div>
                <label htmlFor="cs-wa-msg" className="mb-1.5 block text-sm font-medium">Default Message</label>
                <textarea id="cs-wa-msg" name="whatsappDefaultMessage" defaultValue={cs.whatsappDefaultMessage ?? ""} rows={3} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
              </div>
            </fieldset>

            <div className={`${saveRowClass} pt-2`}>
              {renderSubmitButton("comm", "Save Changes")}
              {renderSaveStatus("comm")}
            </div>
            </fieldset>
          </form>
        )}

        {/* ─── Booking ─── */}
        {activeTab === "booking" && br && (
          <form
            onSubmit={(event) => handleSubmit(event, updateBookingRules, "booking")}
            className="space-y-5"
          >
            <fieldset disabled={isSaving("booking")} className="space-y-5 disabled:opacity-70">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="br-open" className="mb-1.5 block text-sm font-medium">Opening Time</label>
                <TimePicker id="br-open" name="openingTime" stepMinutes={30} value={openingTime} onChange={(v) => setOpeningTime(v)} placeholder="Opening time" />
              </div>
              <div className="flex-1">
                <label htmlFor="br-close" className="mb-1.5 block text-sm font-medium">Closing Time</label>
                <TimePicker id="br-close" name="closingTime" stepMinutes={30} value={closingTime} onChange={(v) => setClosingTime(v)} placeholder="Closing time" />
              </div>
            </div>
            <div>
              <label htmlFor="br-tz" className="mb-1.5 block text-sm font-medium">Timezone</label>
              <input id="br-tz" name="timezone" defaultValue={br.timezone} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
              <p className="mt-1 text-xs text-muted-foreground">e.g. Africa/Windhoek</p>
            </div>
            <div>
              <label htmlFor="br-mode" className="mb-1.5 block text-sm font-medium">Request Mode</label>
              <Select
                  id="br-mode"
                  name="requestMode"
                  required
                  disabled={isSaving("booking")}
                  value={requestMode}
                  onChange={setRequestMode}
                options={[
                  { value: "booking_request", label: "Booking Request (requires confirmation)" },
                  { value: "confirmed", label: "Auto-confirmed" },
                ]}
                placeholder="Select mode"
              />
            </div>
            <div>
              <label htmlFor="br-dup" className="mb-1.5 block text-sm font-medium">Duplicate Window (minutes)</label>
              <input id="br-dup" name="duplicateWindowMinutes" type="number" min="0" defaultValue={br.duplicateWindowMinutes} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            </div>
            <div className={`${saveRowClass} pt-2`}>
              {renderSubmitButton("booking", "Save Changes")}
              {renderSaveStatus("booking")}
            </div>
            </fieldset>
          </form>
        )}

        {/* ─── Documents ─── */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            {seqs.length === 0 && <p className="text-muted-foreground">No document sequences found.</p>}
            {seqs.map((seq) => {
              const labels: Record<string, string> = { invoice: "Invoice", receipt: "Receipt", quotation: "Quotation" };
              const label = labels[seq.documentType] ?? seq.documentType;
              return (
                <form
                  key={seq.id}
                  onSubmit={(event) => handleSubmit(event, updateDocumentSequence, `doc-${seq.documentType}`)}
                  className="rounded-xl border border-border p-5"
                >
                  <fieldset disabled={isSaving(`doc-${seq.documentType}`)} className="disabled:opacity-70">
                  <input type="hidden" name="documentType" value={seq.documentType} />
                  <h2 className="text-lg font-semibold capitalize">{label}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Preview: <span className="font-mono text-foreground">{seq.prefix}{String(seq.nextNumber).padStart(seq.padding, "0")}</span>
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor={`pre-${seq.documentType}`} className="mb-1.5 block text-sm font-medium">Prefix</label>
                      <input id={`pre-${seq.documentType}`} name="prefix" defaultValue={seq.prefix} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                    </div>
                    <div>
                      <label htmlFor={`next-${seq.documentType}`} className="mb-1.5 block text-sm font-medium">Next Number</label>
                      <input id={`next-${seq.documentType}`} name="nextNumber" type="number" min="1" defaultValue={seq.nextNumber} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                    </div>
                    <div>
                      <label htmlFor={`pad-${seq.documentType}`} className="mb-1.5 block text-sm font-medium">Padding</label>
                      <input id={`pad-${seq.documentType}`} name="padding" type="number" min="1" defaultValue={seq.padding} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className={saveRowClass}>
                      {renderSubmitButton(`doc-${seq.documentType}`, "Save")}
                      {renderSaveStatus(`doc-${seq.documentType}`, `Saving ${label.toLowerCase()} numbering...`)}
                    </div>
                  </div>
                  </fieldset>
                </form>
              );
            })}

            <div className="rounded-xl border border-border bg-surface-muted p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">Document presets</p>
                  <h2 className="mt-1 text-lg font-semibold">Additional item presets moved to Services</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Manage reusable document charges beside service categories and screening, where staff can find them faster.
                  </p>
                </div>
                <Link
                  href="/dashboard/services/additional-items"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Open Additional Items
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
