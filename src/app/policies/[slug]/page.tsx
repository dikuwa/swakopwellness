import Link from "next/link";
import { PageShell } from "@/public/components";
import { getBusinessSettings, getCommunicationSettings, getPolicyBySlug } from "@/public/data";

export const dynamic = "force-dynamic";

export default async function PolicyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [business, communication, policy] = await Promise.all([getBusinessSettings(), getCommunicationSettings(), getPolicyBySlug(slug)]);

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <Link href="/policies" className="text-sm font-semibold text-primary underline underline-offset-4">All policies</Link>
        <article className="mt-6 rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
          <h1 className="text-5xl font-semibold tracking-[-0.05em]">{policy.title}</h1>
          <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{policy.body}</p>
        </article>
      </main>
    </PageShell>
  );
}
