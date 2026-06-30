import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { businessSettings } from "@/db/schema";
import { DashboardNav } from "@/dashboard/components";
import { updateBusinessSettings } from "@/settings/actions";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  await requirePermission("settings:manage");
  const db = getDb();

  const [settings] = await db.select().from(businessSettings).limit(1);

  if (!settings) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
        <section className="mx-auto max-w-3xl rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
          <DashboardNav />
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Business Settings</h1>
          <p className="mt-6 text-muted-foreground">No business settings found. Please seed the database.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-3xl rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
        <DashboardNav />
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
          <div>
            <label htmlFor="documentDetails" className="mb-1.5 block text-sm font-medium">Document Details (JSON)</label>
            <textarea id="documentDetails" name="documentDetails" defaultValue={JSON.stringify(settings.documentDetails, null, 2)} rows={6} className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-foreground" />
            <p className="mt-1 text-xs text-muted-foreground">Custom JSON data included in document templates (banking details, footer, etc.).</p>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" className="h-11 rounded-xl bg-[oklch(0.49_0.16_158)] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Save Changes
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
