import type { Metadata } from "next";
import { requireAuth } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile — Swakop Wellness Centre",
};

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Account</p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage your display name, profile picture, and password. Your login email is kept separate from profile edits.
        </p>
      </div>
      <ProfileForm name={user.name} email={user.email} avatarUrl={user.avatarUrl} />
    </DashboardShell>
  );
}
