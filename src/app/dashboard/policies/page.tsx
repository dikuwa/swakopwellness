import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
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

  const totalPolicies = allPolicies.length;
  const publicPolicies = allPolicies.filter((p) => p.publicVisible).length;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Policies</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage your website and client policies.</p>
        </div>
        <Link
          href="/dashboard/policies/new"
          className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Policy
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-3 max-w-md">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="text-lg font-bold">{totalPolicies}</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-sm font-bold tracking-tight mt-0.5">Policies</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <span className="text-lg font-bold">{publicPolicies}</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Public</p>
            <p className="text-sm font-bold tracking-tight mt-0.5">Policies</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-semibold">All Policies</h2>
        </div>
        {allPolicies.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No policies yet. Create your first policy to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-surface-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Slug</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <span className="font-medium truncate block">{policy.title}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] text-muted-foreground font-mono text-xs truncate">
                      {policy.slug}
                    </td>
                    <td className="py-3.5 px-4">
                      <form action={togglePolicyPublic.bind(null, policy.id)}>
                        <button
                          type="submit"
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            policy.publicVisible
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-50 text-gray-500"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${policy.publicVisible ? "bg-green-600" : "bg-gray-400"}`} />
                          {policy.publicVisible ? "Public" : "Hidden"}
                        </button>
                      </form>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-2">
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
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
