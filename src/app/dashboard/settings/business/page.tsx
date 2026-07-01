import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { businessSettings } from "@/db/schema";
import { DashboardLayout } from "@/dashboard/components";
import { logoutAction } from "../../actions";
import { updateBusinessSettings } from "@/settings/actions";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  await requirePermission("settings:manage");
  const db = getDb();

  const [settings] = await db.select().from(businessSettings).limit(1);

  if (!settings) {
    return (
      <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Business Settings</h1>
        <p className="mt-6 text-muted-foreground">No business settings found. Please seed the database.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
        <div className="mb-6">
          <a href="/dashboard/settings" className="text-sm text-muted-foreground hover:text-foreground">&larr; All Settings</a>
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Business Settings</h1>
        <form action={updateBusinessSettings as unknown as (formData: FormData) => Promise<void>} className="mt-8 space-y-5">
          <div>
            <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium">Business Name</label>
            <input id="businessName" name="businessName" defaultValue={settings.businessName} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
          </div>
          <div>
            <label htmlFor="address" className="mb-1.5 block text-sm font-medium">Address</label>
            <textarea id="address" name="address" defaultValue={settings.address} required rows={3} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
          </div>
          <div>
            <label htmlFor="telephone" className="mb-1.5 block text-sm font-medium">Phone</label>
            <input id="telephone" name="telephone" defaultValue={settings.telephone} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" defaultValue={settings.email} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
          </div>
          <div>
            <label htmlFor="operatingHours" className="mb-1.5 block text-sm font-medium">Operating Hours</label>
            <textarea id="operatingHours" name="operatingHours" defaultValue={settings.operatingHours} required rows={2} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
          </div>
          <div>
            <label htmlFor="appointmentModel" className="mb-1.5 block text-sm font-medium">Appointment Model</label>
            <input id="appointmentModel" name="appointmentModel" defaultValue={settings.appointmentModel} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
          </div>
          <div className="flex gap-6">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium">Currency Code</label>
              <input value={settings.currencyCode} readOnly className="h-11 w-full rounded-xl border border-border bg-surface-muted px-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium">Currency Symbol</label>
              <input value={settings.currencySymbol} readOnly className="h-11 w-full rounded-xl border border-border bg-surface-muted px-4 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label htmlFor="medicalDisclaimer" className="mb-1.5 block text-sm font-medium">Medical Disclaimer</label>
            <textarea id="medicalDisclaimer" name="medicalDisclaimer" defaultValue={settings.medicalDisclaimer} required rows={4} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
          </div>
          <div className="border-t border-border pt-6 mt-6">
            <h2 className="text-lg font-semibold">Document Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">These appear on invoices, receipts, and quotations.</p>

            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="registrationNumber" className="mb-1.5 block text-sm font-medium">Registration Number</label>
                  <input id="registrationNumber" name="registrationNumber" defaultValue={(settings.documentDetails as Record<string, unknown>)?.registrationNumber as string ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                </div>
                <div>
                  <label htmlFor="taxNumber" className="mb-1.5 block text-sm font-medium">Tax Number</label>
                  <input id="taxNumber" name="taxNumber" defaultValue={(settings.documentDetails as Record<string, unknown>)?.taxNumber as string ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                </div>
              </div>
              <div>
                <label htmlFor="bankingDetails" className="mb-1.5 block text-sm font-medium">Banking Details</label>
                <textarea id="bankingDetails" name="bankingDetails" defaultValue={(settings.documentDetails as Record<string, unknown>)?.bankingDetails as string ?? ""} rows={3} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
                <p className="mt-1 text-xs text-muted-foreground">Bank name, account number, branch code, etc.</p>
              </div>
              <div>
                <label htmlFor="footerMessage" className="mb-1.5 block text-sm font-medium">Footer Message</label>
                <textarea id="footerMessage" name="footerMessage" defaultValue={(settings.documentDetails as Record<string, unknown>)?.footerMessage as string ?? ""} rows={2} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
                <p className="mt-1 text-xs text-muted-foreground">Displayed at the bottom of invoices, receipts, and quotations.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" className="h-11 rounded-xl bg-[oklch(0.49_0.16_158)] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Save Changes
            </button>
          </div>
        </form>
    </DashboardLayout>
  );
}
