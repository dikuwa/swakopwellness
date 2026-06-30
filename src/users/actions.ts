"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/auth/session";
import { hashPassword } from "@/auth/password";
import { getDb } from "@/db/client";
import { roles, userRoles, users } from "@/db/schema";
import { recordActivity } from "@/activity-log/record";

const validRoles = ["Owner", "Admin", "Staff"] as const;

function emailError(email: string): string | null {
  if (!email) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email address.";
  return null;
}

export async function createUser(formData: FormData) {
  const user = await requirePermission("users:manage");
  const db = getDb();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const roleName = formData.get("role") as string;

  if (!name || name.length < 2) return { ok: false as const, error: "Name is required (min 2 characters)." };
  const emailErr = emailError(email);
  if (emailErr) return { ok: false as const, error: emailErr };
  if (!password || password.length < 8) return { ok: false as const, error: "Password is required (min 8 characters)." };
  if (!validRoles.includes(roleName as typeof validRoles[number])) return { ok: false as const, error: "Invalid role." };

  const [existing] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  if (existing) return { ok: false as const, error: "A user with this email already exists." };

  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, roleName)).limit(1);
  if (!role) return { ok: false as const, error: "Role not found." };

  const passwordHash = await hashPassword(password);

  const [inserted] = await db
    .insert(users)
    .values({ name, email, passwordHash, active: true })
    .returning({ id: users.id });

  await db.insert(userRoles).values({ userId: inserted.id, roleId: role.id });

  await recordActivity(user.id, "user_created", "user", inserted.id, `Created user ${name} (${email}) with role ${roleName}`);

  revalidatePath("/dashboard/users");
  return { ok: true as const, userId: inserted.id };
}

export async function updateUser(formData: FormData) {
  const user = await requirePermission("users:manage");
  const db = getDb();

  const userId = formData.get("userId") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const active = formData.get("active") === "on";
  const roleName = formData.get("role") as string;

  if (!userId) return { ok: false as const, error: "User ID is required." };
  if (!name || name.length < 2) return { ok: false as const, error: "Name is required (min 2 characters)." };
  const emailErr = emailError(email);
  if (emailErr) return { ok: false as const, error: emailErr };
  if (!validRoles.includes(roleName as typeof validRoles[number])) return { ok: false as const, error: "Invalid role." };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(ne(users.id, userId), sql`lower(${users.email}) = ${email}`))
    .limit(1);
  if (existing) return { ok: false as const, error: "Another user with this email already exists." };

  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, roleName)).limit(1);
  if (!role) return { ok: false as const, error: "Role not found." };

  if (password && password.length > 0) {
    if (password.length < 8) return { ok: false as const, error: "Password must be at least 8 characters." };
    const passwordHash = await hashPassword(password);
    await db.update(users).set({ name, email, active, passwordHash }).where(eq(users.id, userId));
  } else {
    await db.update(users).set({ name, email, active }).where(eq(users.id, userId));
  }

  const [currentRole] = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))
    .limit(1);

  if (!currentRole || currentRole.roleId !== role.id) {
    await db.delete(userRoles).where(eq(userRoles.userId, userId));
    await db.insert(userRoles).values({ userId, roleId: role.id });
  }

  await recordActivity(user.id, "user_updated", "user", userId, `Updated user ${name} (${email})`);

  revalidatePath("/dashboard/users");
  return { ok: true as const };
}

export async function toggleUserActive(userId: string) {
  const user = await requirePermission("users:manage");
  const db = getDb();

  if (userId === user.id) throw new Error("You cannot deactivate yourself.");

  const [target] = await db.select({ id: users.id, active: users.active, name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target) throw new Error("User not found.");

  await db.update(users).set({ active: !target.active }).where(eq(users.id, userId));

  await recordActivity(user.id, "user_toggled_active", "user", userId, `${target.active ? "Deactivated" : "Activated"} user ${target.name} (${target.email})`);

  revalidatePath("/dashboard/users");
}
