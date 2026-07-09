"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2, Store, MessageSquare, CalendarRange, FileText, Loader2, Plus, Trash2,
} from "lucide-react";
import { Select, TimePicker, Checkbox } from "@/ui/components";
import { createDocumentPredefinedItem, deleteDocumentPredefinedItem, updateBusinessSettings, updateCommunicationSettings, updateBookingRules, updateDocumentPredefinedItem, updateDocumentSequence } from "@/settings/actions";
import { fmtCents } from "@/documents/calculate";

const TABS = [
  { id: "general", label: "General", icon: Store },
  { id: "communication", label: "Communication", icon: MessageSquare },
  { id: "booking", label: "Booking", icon: CalendarRange },
  { id: "documents", label: "Documents", icon: FileText },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PREDEFINED_ITEM_TYPE_OPTIONS = [
  { value: "service", label: "Service" },
  { value: "product", label: "Product" },
  { value: "fee", label: "Fee" },
  { value: "discount", label: "Discount" },
  { value: "other", label: "Other" },
];

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
  predefinedItems,
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
  predefinedItems: {
    id: string; label: string; description: string; itemType: string; unitPriceCents: number; sortOrder: number; active: boolean;
  }[];
  mediaAssets: MediaAsset[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openingTime, setOpeningTime] = useState(br?.openingTime ?? "08:00");
  const [closingTime, setClosingTime] = useState(br?.closingTime ?? "17:00");
  const newPresetFormRef = useRef<HTMLFormElement>(null);

  const handleAction = async (
    action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>,
    formData: FormData,
    label: string,
    successMessage?: string,
    onSuccess?: () => void,
  ) => {
    setSaving(label);
    setError(null);
    setSuccess(null);
    const result = await action(formData);
    if (!result.ok) {
      setError(result.error ?? "Save failed");
    } else {
      setSuccess(successMessage ?? "Changes saved.");
      onSuccess?.();
    }
    setSaving(null);
  };

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
            action={async (fd) => handleAction(updateBusinessSettings, fd, "general")}
            className="space-y-5"
          >
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

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={saving === "general"}
                className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving === "general" ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* ─── Communication ─── */}
        {activeTab === "communication" && cs && (
          <form
            action={async (fd) => handleAction(updateCommunicationSettings, fd, "comm")}
            className="space-y-6"
          >
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

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={saving === "comm"}
                className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving === "comm" ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* ─── Booking ─── */}
        {activeTab === "booking" && br && (
          <form
            action={async (fd) => handleAction(updateBookingRules, fd, "booking")}
            className="space-y-5"
          >
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
                value={br.requestMode}
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
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={saving === "booking"}
                className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving === "booking" ? "Saving..." : "Save Changes"}
              </button>
            </div>
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
                  action={async (fd) => handleAction(updateDocumentSequence, fd, `doc-${seq.documentType}`)}
                  className="rounded-xl border border-border p-5"
                >
                  <input type="hidden" name="documentType" value={seq.documentType} />
                  <h2 className="text-lg font-semibold capitalize">{label}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Preview: <span className="font-mono text-foreground">{seq.prefix}{String(seq.nextNumber).padStart(seq.padding, "0")}</span>
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-4">
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
                    <button
                      type="submit"
                      disabled={saving === `doc-${seq.documentType}`}
                      className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {saving === `doc-${seq.documentType}` ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              );
            })}

            <section className="rounded-xl border border-border p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">Document presets</p>
                  <h2 className="mt-1 text-lg font-semibold">Additional item presets</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Manage the reusable charges shown in the Documents page “Select predefined item” dropdown. Active items appear for invoices, quotations, and receipts.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-muted-foreground">
                  {predefinedItems.length} saved
                </div>
              </div>

              <form
                ref={newPresetFormRef}
                action={async (fd) => handleAction(
                  createDocumentPredefinedItem,
                  fd,
                  "preset-new",
                  "Predefined item added.",
                  () => newPresetFormRef.current?.reset(),
                )}
                className="mt-5 rounded-xl border border-border bg-surface-muted p-4"
              >
                <h3 className="text-sm font-semibold">Add a predefined item</h3>
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(170px,1fr)_minmax(190px,1.3fr)_150px_130px_100px_90px]">
                  <div>
                    <label htmlFor="preset-new-label" className="mb-1.5 block text-sm font-medium">Item name</label>
                    <input id="preset-new-label" name="label" placeholder="e.g. Admin fee" required className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="preset-new-description" className="mb-1.5 block text-sm font-medium">Description</label>
                    <input id="preset-new-description" name="description" placeholder="Shown on document line" className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Type</label>
                    <Select name="itemType" value="other" options={PREDEFINED_ITEM_TYPE_OPTIONS} />
                  </div>
                  <div>
                    <label htmlFor="preset-new-price" className="mb-1.5 block text-sm font-medium">Price</label>
                    <input id="preset-new-price" name="unitPrice" type="number" min="0" step="0.01" placeholder="0.00" className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="preset-new-order" className="mb-1.5 block text-sm font-medium">Order</label>
                    <input id="preset-new-order" name="sortOrder" type="number" min="0" step="1" placeholder="0" className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
                  </div>
                  <label className="flex h-full min-h-11 items-end gap-2 pb-3 text-sm font-medium lg:justify-center">
                    <input type="checkbox" name="active" defaultChecked className="h-4 w-4 rounded border-border accent-primary" />
                    Active
                  </label>
                </div>
                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={saving === "preset-new"}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {saving === "preset-new" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                    {saving === "preset-new" ? "Adding..." : "Add item"}
                  </button>
                </div>
              </form>

              <div className="mt-5 space-y-3">
                {predefinedItems.length > 0 ? (
                  <div className="hidden grid-cols-[minmax(170px,1fr)_minmax(190px,1.3fr)_150px_130px_100px_90px_116px] gap-4 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground lg:grid">
                    <span>Item name</span>
                    <span>Description</span>
                    <span>Type</span>
                    <span>Price</span>
                    <span>Order</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                ) : null}
                {predefinedItems.map((item) => (
                  <form
                    key={item.id}
                    action={async (fd) => handleAction(updateDocumentPredefinedItem, fd, `preset-${item.id}`, "Predefined item updated.")}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <div className="grid gap-4 lg:grid-cols-[minmax(170px,1fr)_minmax(190px,1.3fr)_150px_130px_100px_90px_116px] lg:items-end">
                      <div>
                        <label htmlFor={`preset-label-${item.id}`} className="mb-1.5 block text-sm font-medium lg:sr-only">Item name</label>
                        <input id={`preset-label-${item.id}`} name="label" defaultValue={item.label} required className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                      </div>
                      <div>
                        <label htmlFor={`preset-description-${item.id}`} className="mb-1.5 block text-sm font-medium lg:sr-only">Description</label>
                        <input id={`preset-description-${item.id}`} name="description" defaultValue={item.description} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium lg:sr-only">Type</label>
                        <Select name="itemType" value={item.itemType} options={PREDEFINED_ITEM_TYPE_OPTIONS} />
                      </div>
                      <div>
                        <label htmlFor={`preset-price-${item.id}`} className="mb-1.5 block text-sm font-medium lg:sr-only">Price</label>
                        <input id={`preset-price-${item.id}`} name="unitPrice" type="number" min="0" step="0.01" defaultValue={(item.unitPriceCents / 100).toFixed(2)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                      </div>
                      <div>
                        <label htmlFor={`preset-order-${item.id}`} className="mb-1.5 block text-sm font-medium lg:sr-only">Order</label>
                        <input id={`preset-order-${item.id}`} name="sortOrder" type="number" min="0" step="1" defaultValue={item.sortOrder} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                      </div>
                      <label className="flex h-11 items-center gap-2 text-sm font-medium">
                        <input type="checkbox" name="active" defaultChecked={item.active} className="h-4 w-4 rounded border-border accent-primary" />
                        Active
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={saving === `preset-${item.id}`}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {saving === `preset-${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                          {saving === `preset-${item.id}` ? "Saving" : "Save"}
                        </button>
                        <button
                          type="submit"
                          formNoValidate
                          formAction={async (fd) => handleAction(deleteDocumentPredefinedItem, fd, `preset-delete-${item.id}`, "Predefined item deleted.")}
                          disabled={saving === `preset-delete-${item.id}`}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-surface-muted hover:text-destructive disabled:opacity-50"
                          aria-label={`Delete ${item.label}`}
                          title={`Delete ${item.label}`}
                        >
                          {saving === `preset-delete-${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Dropdown preview: {item.label} - {fmtCents(item.unitPriceCents)}</p>
                  </form>
                ))}
                {predefinedItems.length === 0 ? (
                  <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">No predefined items yet. Add the first one above to make it available on generated documents.</p>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
