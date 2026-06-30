import { requirePermission } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { getFollowUps } from "@/dashboard/data";
import { formatFollowUpStatus, getFollowUpDisplayStatus, type FollowUpStatus } from "@/followups/status";

export const dynamic = "force-dynamic";

export default async function DashboardFollowUpsPage() {
  await requirePermission("bookings:view");
  const followUps = await getFollowUps();

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
        <DashboardNav />
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Follow-ups</h1>
        <p className="mt-3 text-sm text-muted-foreground">Due today, overdue and upcoming client follow-ups.</p>
        <div className="mt-6 space-y-3">
          {followUps.length === 0 ? <p className="rounded-2xl bg-surface-muted p-5 text-sm text-muted-foreground">No follow-ups scheduled yet.</p> : null}
          {followUps.map((followUp) => {
            const status = getFollowUpDisplayStatus(followUp.dueAt, new Date(), followUp.status as FollowUpStatus);
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
                    <p className="mt-1 text-muted-foreground">{followUp.dueAt.toLocaleString("en-NA")}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
