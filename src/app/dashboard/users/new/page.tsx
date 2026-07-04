import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { roles } from "@/db/schema";
import { createUser } from "@/users/actions";
import { UserForm } from "../user-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New User — Dashboard",
};

export default async function NewUserPage() {
  await requirePermission("users:manage");
  const db = getDb();

  const allRoles = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .orderBy(roles.createdAt);

  return <UserForm roles={allRoles} action={createUser} />;
}
