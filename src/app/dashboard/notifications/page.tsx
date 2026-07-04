import type { Metadata } from "next";
import { requireAuth } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { getDb } from "@/db/client";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NotificationList } from "./notification-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications — Swakop Wellness Centre",
};

export default async function NotificationsPage() {
  const user = await requireAuth();
  const db = getDb();

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Notifications</h1>
      </div>
      <NotificationList items={items} />
    </DashboardShell>
  );
}
