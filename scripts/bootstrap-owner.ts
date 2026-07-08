import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq, inArray, sql } from "drizzle-orm";
import { hashPassword } from "../src/auth/password";
import { permissionCodes, rolePermissionDefaults } from "../src/auth/permissions";
import { bootstrapOwnerSchema } from "../src/auth/validation";
import { getDb } from "../src/db/client";
import { permissions, rolePermissions, roles, userRoles, users } from "../src/db/schema";

function loadDotEnv() {
  for (const filename of [".env.local", ".env"]) {
    const envPath = resolve(process.cwd(), filename);
    if (!existsSync(envPath)) continue;

    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      process.env[key] ??= value;
    }
  }
}

async function main() {
  loadDotEnv();

  const parsed = bootstrapOwnerSchema.safeParse({
    name: process.env.OWNER_NAME,
    email: process.env.OWNER_EMAIL,
    password: process.env.OWNER_PASSWORD,
  });

  if (!parsed.success) {
    console.error("Owner bootstrap requires OWNER_NAME, OWNER_EMAIL and OWNER_PASSWORD. Password must be at least 12 characters.");
    process.exit(1);
  }

  const db = getDb();

  const ownerEmail = parsed.data.email.toLowerCase();
  const passwordHash = await hashPassword(parsed.data.password);
  let ownerAction: "created" | "updated" = "created";

  await db.transaction(async (tx) => {
    await tx.insert(permissions).values(permissionCodes.map((code) => ({ code, description: code }))).onConflictDoNothing();

    const insertedPermissions = await tx.select({ id: permissions.id, code: permissions.code }).from(permissions).where(inArray(permissions.code, [...permissionCodes]));

    const systemRoles = [
      { name: "Owner", description: "Full system access", system: true },
      { name: "Admin", description: "Operational access based on assigned permissions", system: true },
      { name: "Staff", description: "Restricted operational access", system: true },
    ];

    for (const role of systemRoles) {
      const [existingRole] = await tx.select({ id: roles.id }).from(roles).where(eq(sql`lower(${roles.name})`, role.name.toLowerCase())).limit(1);
      if (!existingRole) {
        await tx.insert(roles).values(role);
      }
    }

    const insertedRoles = await tx.select({ id: roles.id, name: roles.name }).from(roles).where(inArray(roles.name, systemRoles.map((role) => role.name)));

    for (const role of insertedRoles) {
      const defaults = rolePermissionDefaults[role.name as keyof typeof rolePermissionDefaults];
      const assigned = insertedPermissions.filter((permission) => defaults.includes(permission.code as never));
      await tx.insert(rolePermissions).values(assigned.map((permission) => ({ roleId: role.id, permissionId: permission.id }))).onConflictDoNothing();
    }

    const [existingOwner] = await tx.select({ id: users.id }).from(users).where(eq(sql`lower(${users.email})`, ownerEmail)).limit(1);
    const [owner] = existingOwner
      ? await tx
          .update(users)
          .set({ name: parsed.data.name, passwordHash, active: true, updatedAt: new Date() })
          .where(eq(users.id, existingOwner.id))
          .returning({ id: users.id })
      : await tx.insert(users).values({ name: parsed.data.name, email: ownerEmail, passwordHash }).returning({ id: users.id });

    ownerAction = existingOwner ? "updated" : "created";

    const [ownerRole] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.name, "Owner")).limit(1);
    await tx.insert(userRoles).values({ userId: owner.id, roleId: ownerRole.id }).onConflictDoNothing();
  });

  console.log(`Owner account ${ownerAction} for ${parsed.data.email}.`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
