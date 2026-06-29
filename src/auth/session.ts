import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { permissions, rolePermissions, roles, sessions, userRoles, users } from "@/db/schema";
import type { PermissionCode } from "./permissions";
import { hasPermission } from "./permissions";
import { createSessionToken, hashSessionToken } from "./token";

export const sessionCookieName = "swc_session";
const sessionDays = 14;

export async function createSession(userId: string) {
  const db = getDb();
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({ userId, tokenHash: hashSessionToken(token), expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function revokeCurrentSession() {
  const db = getDb();
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, hashSessionToken(token)));
  }

  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser() {
  const db = getDb();
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) return null;

  const [session] = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(and(eq(sessions.tokenHash, hashSessionToken(token)), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!session) return null;

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, active: users.active })
    .from(users)
    .where(and(eq(users.id, session.userId), eq(users.active, true)))
    .limit(1);

  if (!user) return null;

  const permissionRows = await db
    .select({ code: permissions.code })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, user.id));

  return { ...user, permissions: permissionRows.map((row) => row.code) };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: PermissionCode) {
  const user = await requireAuth();
  if (!hasPermission(user.permissions, permission)) redirect("/dashboard/denied");
  return user;
}
