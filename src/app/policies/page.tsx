import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/public/components";
import { getBusinessSettings, getCommunicationSettings, getPublicPolicies } from "@/public/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Policies",
  description: "Read Swakop Wellness Centre's policies on privacy, cancellations, and terms of service.",
};

export default async function PoliciesPage() {
  const [business, communication, policies] = await Promise.all([getBusinessSettings(), getCommunicationSettings(), getPublicPolicies()]);

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <h1 className="text-5xl font-semibold tracking-[-0.05em]">Policies</h1>
        <div className="mt-8 space-y-4">
          {policies.map((policy) => (
            <Link key={policy.id} href={`/policies/${policy.slug}`} className="block rounded-2xl border border-border bg-surface p-5 hover:bg-surface-muted">
              <h2 className="text-xl font-semibold tracking-[-0.025em]">{policy.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">Read policy</p>
            </Link>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
