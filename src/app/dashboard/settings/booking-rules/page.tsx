import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { bookingRules } from "@/db/schema";
import { DashboardNav } from "@/dashboard/components";
import { updateBookingRules } from "@/settings/actions";

export const dynamic = "force-dynamic";

export default async function BookingRulesPage() {
  await requirePermission("settings:manage");
  const db = getDb();

  const [rules] = await db.select().from(bookingRules).limit(1);

  if (!rules) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
        <section className="mx-auto max-w-3xl rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
          <DashboardNav />
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Booking Rules</h1>
          <p className="mt-6 text-muted-foreground">No booking rules found. Please seed the database.</p>
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
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Booking Rules</h1>
        <form action={updateBookingRules as unknown as (formData: FormData) => Promise<void>} className="mt-8 space-y-5">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="openingTime" className="mb-1.5 block text-sm font-medium">Opening Time</label>
              <input id="openingTime" name="openingTime" type="time" defaultValue={rules.openingTime} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            </div>
            <div className="flex-1">
              <label htmlFor="closingTime" className="mb-1.5 block text-sm font-medium">Closing Time</label>
              <input id="closingTime" name="closingTime" type="time" defaultValue={rules.closingTime} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            </div>
          </div>
          <div>
            <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium">Timezone</label>
            <input id="timezone" name="timezone" defaultValue={rules.timezone} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            <p className="mt-1 text-xs text-muted-foreground">e.g. Africa/Windhoek</p>
          </div>
          <div>
            <label htmlFor="requestMode" className="mb-1.5 block text-sm font-medium">Request Mode</label>
            <select id="requestMode" name="requestMode" defaultValue={rules.requestMode} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground">
              <option value="booking_request">Booking Request (requires confirmation)</option>
              <option value="confirmed">Auto-confirmed</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">Controls whether new bookings are automatically confirmed or require manual approval.</p>
          </div>
          <div>
            <label htmlFor="duplicateWindowMinutes" className="mb-1.5 block text-sm font-medium">Duplicate Window (minutes)</label>
            <input id="duplicateWindowMinutes" name="duplicateWindowMinutes" type="number" min="0" defaultValue={rules.duplicateWindowMinutes} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
            <p className="mt-1 text-xs text-muted-foreground">Minimum interval between identical booking attempts from the same client.</p>
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
