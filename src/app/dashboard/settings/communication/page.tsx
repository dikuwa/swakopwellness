import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { communicationSettings } from "@/db/schema";
import { DashboardShell } from "@/dashboard/shell";
import { logoutAction } from "../../actions";
import { updateCommunicationSettings } from "@/settings/actions";

export const dynamic = "force-dynamic";

export default async function CommunicationSettingsPage() {
  await requirePermission("settings:manage");
  const db = getDb();

  const [settings] = await db.select().from(communicationSettings).limit(1);

  if (!settings) {
    return (
      <DashboardShell>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Communication Settings</h1>
        <p className="mt-6 text-muted-foreground">No communication settings found. Please seed the database.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
        <div className="mb-6">
          <a href="/dashboard/settings" className="text-sm text-muted-foreground hover:text-foreground">&larr; All Settings</a>
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Communication Settings</h1>
        <form action={updateCommunicationSettings as unknown as (formData: FormData) => Promise<void>} className="mt-8 space-y-8">

          <fieldset className="space-y-4 rounded-xl border border-border bg-surface-muted p-5">
            <legend className="text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">Phone</legend>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked={settings.enableCalls} name="enableCalls" className="h-5 w-5 rounded border-border accent-[oklch(0.49_0.16_158)]" />
              <span className="text-sm">Enable calls</span>
            </label>
            <div>
              <label htmlFor="mainPhone" className="mb-1.5 block text-sm font-medium">Main Phone</label>
              <input id="mainPhone" name="mainPhone" defaultValue={settings.mainPhone} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-xl border border-border bg-surface-muted p-5">
            <legend className="text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">Email</legend>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked={settings.enableEmailContact} name="enableEmailContact" className="h-5 w-5 rounded border-border accent-[oklch(0.49_0.16_158)]" />
              <span className="text-sm">Enable email contact</span>
            </label>
            <div>
              <label htmlFor="businessEmail" className="mb-1.5 block text-sm font-medium">Business Email</label>
              <input id="businessEmail" name="businessEmail" type="email" defaultValue={settings.businessEmail} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            </div>
            <div>
              <label htmlFor="bookingNotificationEmail" className="mb-1.5 block text-sm font-medium">Booking Notification Email</label>
              <input id="bookingNotificationEmail" name="bookingNotificationEmail" type="email" defaultValue={settings.bookingNotificationEmail ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            </div>
            <div>
              <label htmlFor="acknowledgementEmail" className="mb-1.5 block text-sm font-medium">Acknowledgement Email</label>
              <input id="acknowledgementEmail" name="acknowledgementEmail" type="email" defaultValue={settings.acknowledgementEmail ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            </div>
            <div>
              <label htmlFor="replyToEmail" className="mb-1.5 block text-sm font-medium">Reply-To Email</label>
              <input id="replyToEmail" name="replyToEmail" type="email" defaultValue={settings.replyToEmail ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-xl border border-border bg-surface-muted p-5">
            <legend className="text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">WhatsApp</legend>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked={settings.enableWhatsapp} name="enableWhatsapp" className="h-5 w-5 rounded border-border accent-[oklch(0.49_0.16_158)]" />
              <span className="text-sm">Enable WhatsApp</span>
            </label>
            <div>
              <label htmlFor="whatsappNumber" className="mb-1.5 block text-sm font-medium">WhatsApp Number</label>
              <input id="whatsappNumber" name="whatsappNumber" defaultValue={settings.whatsappNumber ?? ""} className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            </div>
            <div>
              <label htmlFor="whatsappDefaultMessage" className="mb-1.5 block text-sm font-medium">Default Message</label>
              <textarea id="whatsappDefaultMessage" name="whatsappDefaultMessage" defaultValue={settings.whatsappDefaultMessage ?? ""} rows={3} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground" />
            </div>
          </fieldset>

          <div className="flex items-center gap-4 pt-2">
            <button type="submit" className="h-11 rounded-xl bg-[oklch(0.49_0.16_158)] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Save Changes
            </button>
          </div>
        </form>
    </DashboardShell>
  );
}
