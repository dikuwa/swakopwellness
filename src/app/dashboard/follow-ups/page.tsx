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
  const [followUps, clients, bookingOptions] = await Promise.all([
    getFollowUps(),
    getClients(1, 1000), // Fetch all clients for the select dropdown
    getFollowUpBookingOptions(),
  ]);

  const clientOptions = clients.rows.map((c: { id: string; fullName: string }) => ({ value: c.id, label: c.fullName }));

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Operations</p>
          <h1 className="mt-2 text-2xl sm:text-3xl tracking-[-0.03em]">Follow-ups</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage client follow-up actions and reminders.</p>
        </div>
      </div>
      <FollowUpForm clients={clientOptions} bookingOptions={bookingOptions} />
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Upcoming Follow-ups</h2>
        <div className="mt-4 space-y-3">
          {followUps.map((fu) => (
            <div key={fu.id} className="rounded-xl border border-border p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{fu.clientName}</p>
                  <p className="text-sm text-muted-foreground">{fu.internalNote}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{fu.dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  <p className="text-muted-foreground">{fu.method}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
