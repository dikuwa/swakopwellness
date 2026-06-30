import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { notifications, roles, userRoles, users } from "@/db/schema";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  summary: string,
  entityType?: string | null,
  entityId?: string | null,
) {
  const db = getDb();
  await db.insert(notifications).values({
    userId,
    type,
    title,
    summary,
    entityType: entityType ?? null,
    entityId: entityId ?? null,
  });
}

export async function notifyStaff(
  type: string,
  title: string,
  summary: string,
  entityType?: string | null,
  entityId?: string | null,
) {
  const db = getDb();
  const staffRoles = await db
    .select({ id: roles.id })
    .from(roles)
    .where(inArray(roles.name, ["Owner", "Admin"]));
  if (staffRoles.length === 0) return;

  const roleIds = staffRoles.map((r) => r.id);
  const staffUsers = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(userRoles, eq(users.id, userRoles.userId))
    .where(inArray(userRoles.roleId, roleIds));

  if (staffUsers.length === 0) return;

  await db.insert(notifications).values(
    staffUsers.map((u) => ({
      userId: u.id,
      type,
      title,
      summary,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
    })),
  );
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const db = getDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), sql`${notifications.readAt} IS NULL`));
  return result?.count ?? 0;
}

