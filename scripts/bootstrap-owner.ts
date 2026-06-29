import { eq, inArray } from "drizzle-orm";
import { hashPassword } from "../src/auth/password";
import { permissionCodes, rolePermissionDefaults } from "../src/auth/permissions";
import { bootstrapOwnerSchema } from "../src/auth/validation";
import { getDb } from "../src/db/client";
import { permissions, rolePermissions, roles, userRoles, users } from "../src/db/schema";

async function main() {
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

  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
  if (existingUsers.length > 0) {
    console.error("Owner bootstrap refused: at least one user already exists.");
    process.exit(1);
  }

  await db.transaction(async (tx) => {
    await tx.insert(permissions).values(permissionCodes.map((code) => ({ code, description: code })));

    const insertedPermissions = await tx.select({ id: permissions.id, code: permissions.code }).from(permissions).where(inArray(permissions.code, [...permissionCodes]));

    const insertedRoles = await tx
      .insert(roles)
      .values([
        { name: "Owner", description: "Full system access", system: true },
        { name: "Admin", description: "Operational access based on assigned permissions", system: true },
        { name: "Staff", description: "Restricted operational access", system: true },
      ])
      .returning({ id: roles.id, name: roles.name });

    for (const role of insertedRoles) {
      const defaults = rolePermissionDefaults[role.name as keyof typeof rolePermissionDefaults];
      const assigned = insertedPermissions.filter((permission) => defaults.includes(permission.code as never));
      await tx.insert(rolePermissions).values(assigned.map((permission) => ({ roleId: role.id, permissionId: permission.id })));
    }

    const [owner] = await tx
      .insert(users)
      .values({ name: parsed.data.name, email: parsed.data.email.toLowerCase(), passwordHash: await hashPassword(parsed.data.password) })
      .returning({ id: users.id });

    const [ownerRole] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.name, "Owner")).limit(1);
    await tx.insert(userRoles).values({ userId: owner.id, roleId: ownerRole.id });
  });

  console.log(`Owner account created for ${parsed.data.email}.`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
