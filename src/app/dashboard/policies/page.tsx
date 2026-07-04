import Link from "next/link";
import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { policies } from "@/db/schema";
import { DashboardShell } from "@/dashboard/shell";
import { deletePolicy, togglePolicyPublic } from "@/policies/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Policies — Swakop Wellness Centre",
};

export default async function PoliciesPage() {
  await requirePermission("settings:manage");
  const db = getDb();

  const allPolicies = await db
    .select()
    .from(policies)
    .orderBy(asc(policies.title));

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">
            Policies
          </h1>
        </div>
          <Link
            href="/dashboard/policies/new"
            className="flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            New Policy
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-3">Title</th>
                <th>Slug</th>
                <th>Public</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allPolicies.map((policy) => (
                <tr
                  key={policy.id}
                  className="border-t border-border hover:bg-surface-muted/50"
                >
                  <td className="max-w-[240px] truncate py-3 font-medium">
                    {policy.title}
                  </td>
                  <td className="max-w-[200px] truncate text-muted-foreground font-mono text-xs">
                    {policy.slug}
                  </td>
                  <td>
                    <form action={togglePolicyPublic.bind(null, policy.id)}>
                      <button
                        type="submit"
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          policy.publicVisible
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {policy.publicVisible ? "Yes" : "No"}
                      </button>
                    </form>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/policies/${policy.id}/edit`}
                        className="flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-muted"
                      >
                        Edit
                      </Link>
                      <form action={deletePolicy.bind(null, policy.id)}>
                        <button
                          type="submit"
                          className="flex h-8 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {allPolicies.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No policies yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </DashboardShell>
  );
}
