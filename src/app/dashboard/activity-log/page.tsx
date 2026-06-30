import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { requirePermission } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { activityLog, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function ActivityLogPage() {
  await requirePermission("activity:view");
  const db = getDb();

  const entries = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      entityType: activityLog.entityType,
      summary: activityLog.summary,
      createdAt: activityLog.createdAt,
      userName: users.name,
    })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.userId, users.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(100);

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
        <DashboardNav />
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Activity Log</h1>
        {entries.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Action</th>
                  <th className="py-3 pr-4">Entity</th>
                  <th className="py-3 pr-4">Summary</th>
                  <th className="py-3">Date/Time</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="py-3 pr-4 font-medium">{entry.userName ?? "System"}</td>
                    <td className="py-3 pr-4 capitalize">{entry.action.replaceAll("_", " ")}</td>
                    <td className="py-3 pr-4 capitalize">{entry.entityType.replaceAll("_", " ")}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{entry.summary}</td>
                    <td className="py-3 whitespace-nowrap text-muted-foreground">
                      {entry.createdAt.toLocaleString("en-NA")}
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
