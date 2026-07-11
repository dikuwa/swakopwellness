import type { Metadata } from "next";
import { requireOwner } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getCleanupPreview } from "@/cleanup/actions";
import { ActivityCleanupForm } from "./activity-cleanup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activity Cleanup — Swakop Wellness Centre",
};

export default async function ActivityCleanupPage() {
  await requireOwner();
  const preview = await getCleanupPreview();

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Settings</p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Activity Cleanup</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Permanently clear operational activity records (chat conversations, notifications, activity log) while preserving services, content, settings, uploads, and user accounts.
        </p>
      </div>
      <ActivityCleanupForm initialPreview={preview} />
    </DashboardShell>
  );
}
