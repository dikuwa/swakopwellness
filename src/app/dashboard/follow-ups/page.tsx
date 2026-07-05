import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { hasPermission } from "@/auth/permissions";
import { DashboardShell } from "@/dashboard/shell";
import { getClients, getFollowUpBookingOptions, getFollowUps } from "@/dashboard/data";
import { cancelFollowUp, completeFollowUp, createFollowUp } from "@/followups/actions";
import { formatFollowUpStatus, getFollowUpDisplayStatus, type FollowUpStatus } from "@/followups/status";
import { FollowUpForm } from "./follow-up-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Follow-ups — Swakop Wellness Centre",
};

export default async function DashboardFollowUpsPage() {
  const user = await requirePermission("bookings:view");
  const canUpdateFollowUps = hasPermission(user.permissions, "bookings:update");
  const [followUps, { rows: clients }, bookingOptions] = await Promise.all([getFollowUps(), getClients(), getFollowUpBookingOptions()]);

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Follow-ups</h1>
      </div>
        <p className="mt-3 text-sm text-muted-foreground">Due today, overdue and upcoming client follow-ups.</p>

        {canUpdateFollowUps ? (
          <FollowUpForm clients={clients} bookingOptions={bookingOptions} />
        ) : null}

        <div className="mt-6 space-y-3">
          {followUps.length === 0 ? <p className="rounded-2xl bg-surface-muted p-5 text-sm text-muted-foreground">No follow-ups scheduled yet.</p> : null}
          {followUps.map((followUp) => {
            const status = getFollowUpDisplayStatus(followUp.dueAt, new Date(), followUp.status as FollowUpStatus);
            const canChangeStatus = canUpdateFollowUps && followUp.status === "pending";
            return (
              <article key={followUp.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{followUp.clientName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{followUp.method}, {followUp.bookingReference ?? "no booking linked"}</p>
                    {followUp.internalNote ? <p className="mt-2 text-sm text-muted-foreground">{followUp.internalNote}</p> : null}
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className="font-medium text-primary">{formatFollowUpStatus(status)}</p>
                    <p className="mt-1 text-muted-foreground">{followUp.dueAt.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}</p>
                    {canChangeStatus ? (
                      <div className="mt-3 flex gap-2 sm:justify-end">
                        <form action={async () => { "use server"; await completeFollowUp(followUp.id); }}>
                          <button type="submit" className="h-9 rounded-xl border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-muted">Complete</button>
                        </form>
                        <form action={async () => { "use server"; await cancelFollowUp(followUp.id); }}>
                          <button type="submit" className="h-9 rounded-xl border border-border px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-surface-muted">Cancel</button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
    </DashboardShell>
  );
}
