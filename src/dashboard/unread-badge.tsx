import { getDb } from "@/db/client";
import { notifications } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function UnreadBadge({ userId }: { userId: string }) {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(sql`${notifications.userId} = ${userId} AND ${notifications.readAt} IS NULL`);
  if (!row || row.count === 0) return null;
  return (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[oklch(0.355_0.074_159)] px-1.5 text-xs font-bold text-white">{row.count}</span>
  );
}
