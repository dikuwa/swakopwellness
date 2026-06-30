import Link from "next/link";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { users, userRoles, roles } from "@/db/schema";
import { DashboardNav } from "@/dashboard/components";
import { toggleUserActive } from "@/users/actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requirePermission("users:manage");
  const db = getDb();

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      active: users.active,
      createdAt: users.createdAt,
      roleName: roles.name,
    })
    .from(users)
    .leftJoin(userRoles, eq(users.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .orderBy(users.createdAt);

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-6xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
        <DashboardNav />
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Users</h1>
          <Link
            href="/dashboard/users/new"
            className="flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            New User
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-3">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-surface-muted/50">
                  <td className="py-3 font-medium">{u.name}</td>
                  <td>{u.email}</td>
                  <td className="capitalize">{u.roleName?.toLowerCase() ?? "—"}</td>
                  <td>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.active ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>{u.createdAt.toLocaleDateString("en-NA")}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/users/${u.id}/edit`}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-surface-muted"
                      >
                        Edit
                      </Link>
                      <form action={toggleUserActive.bind(null, u.id)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-surface-muted"
                        >
                          {u.active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
