import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { users, userRoles, roles } from "@/db/schema";
import { updateUser } from "@/users/actions";
import { UserForm } from "../../user-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit User — Dashboard",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  await requirePermission("users:manage");
  const db = getDb();

  const { id } = await params;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      active: users.active,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) notFound();

  const [userRole] = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, id))
    .limit(1);

  const allRoles = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .orderBy(roles.createdAt);

  return (
    <UserForm
      roles={allRoles}
      action={updateUser}
      initialData={{
        userId: user.id,
        name: user.name,
        email: user.email,
        active: user.active,
        roleName: userRole?.roleName ?? "Staff",
      }}
    />
  );
}
