import { requireAuth } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { getDb } from "@/db/client";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { markAllAsRead } from "./actions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireAuth();
  const db = getDb();

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  const hasUnread = items.some((n) => !n.readAt);

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
        <DashboardNav />
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Notifications</h1>
          {hasUnread && (
            <form action={markAllAsRead}>
              <button
                type="submit"
                className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-muted"
              >
                Mark all as read
              </button>
            </form>
          )}
        </div>
        {items.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No notifications yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">Title</th>
                  <th className="pr-4">Summary</th>
                  <th className="pr-4">Type</th>
                  <th className="pr-4">Created At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr
                    key={n.id}
                    className={`border-t border-border transition-colors ${!n.readAt ? "bg-accent/20 font-medium" : ""}`}
                  >
                    <td className="max-w-[180px] truncate py-3 pr-4">{n.title}</td>
                    <td className="max-w-[260px] truncate pr-4 text-muted-foreground">
                      {n.summary}
                    </td>
                    <td className="pr-4 capitalize">{n.type.replaceAll("_", " ")}</td>
                    <td className="pr-4 text-muted-foreground">
                      {n.createdAt.toLocaleString("en-NA")}
                    </td>
                    <td>
                      {n.readAt ? (
                        <span className="text-muted-foreground">Read</span>
                      ) : (
                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                          <span className="inline-block h-2 w-2 rounded-full bg-[oklch(0.55_0.20_36)]" />
                          Unread
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
