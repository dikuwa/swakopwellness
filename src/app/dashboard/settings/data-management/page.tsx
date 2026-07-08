import type { Metadata } from "next";
import { requireOwner } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDataManagementCounts } from "@/data-management/actions";
import { DataManagementForm } from "./data-management-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Data Management — Swakop Wellness Centre",
};

export default async function DataManagementPage() {
  await requireOwner();
  const counts = await getDataManagementCounts();

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Settings</p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Data Management</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Clear test and operational records from the live dashboard without removing users, settings, services, public website content, or media.
        </p>
      </div>
      <DataManagementForm counts={counts} />
    </DashboardShell>
  );
}
