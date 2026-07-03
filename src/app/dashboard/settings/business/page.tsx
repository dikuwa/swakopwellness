import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { businessSettings } from "@/db/schema";
import { DashboardShell } from "@/dashboard/shell";
import { logoutAction } from "../../actions";
import { getMediaAssets } from "@/media/actions";
import { updateBusinessSettings } from "@/settings/actions";

export const dynamic = "force-dynamic";

export default async function BusinessSettingsPage() {
  await requirePermission("settings:manage");
  const db = getDb();

  const [settings] = await db.select().from(businessSettings).limit(1);
  const mediaAssets = await getMediaAssets();

  if (!settings) {
    return (
      <DashboardShell>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Business Settings</h1>
        <p className="mt-6 text-muted-foreground">No business settings found. Please seed the database.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
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
            <h2 className="text-lg font-semibold">Technology Image</h2>
            <p className="mt-1 text-sm text-muted-foreground">Shown in the Diacom Technology section on the homepage.</p>
            <input type="hidden" name="technologyImageId" id="tech-image-input" value={settings.technologyImageId ?? ""} />
            {mediaAssets.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById("tech-image-input") as HTMLInputElement;
                    if (input) input.value = "";
                    document.querySelectorAll("[data-tech-img]").forEach((el) => el.classList.remove("ring-2", "ring-primary"));
                  }}
                  className={`aspect-square overflow-hidden rounded-xl border-2 ${!settings.technologyImageId ? "border-primary" : "border-border"} bg-surface-muted transition-colors hover:border-primary`}
                >
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">None</div>
                </button>
                {mediaAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    data-tech-img
                    data-id={asset.id}
                    onClick={() => {
                      const input = document.getElementById("tech-image-input") as HTMLInputElement;
                      if (input) input.value = asset.id;
                      document.querySelectorAll("[data-tech-img]").forEach((el) => el.classList.remove("ring-2", "ring-primary"));
                      document.querySelector(`[data-tech-img][data-id="${asset.id}"]`)?.classList.add("ring-2", "ring-primary");
                    }}
                    className={`aspect-square overflow-hidden rounded-xl border-2 ${settings.technologyImageId === asset.id ? "border-primary ring-2 ring-primary" : "border-border"} bg-surface transition-colors hover:border-primary`}
                  >
                    {asset.publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.publicUrl} alt={asset.altText ?? ""} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No URL</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No media assets available.{" "}
                <a href="/dashboard/media" className="text-primary underline">Upload images</a> first.
              </p>
            )}
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
    </DashboardShell>
  );
}
