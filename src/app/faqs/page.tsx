import { PageShell } from "@/public/components";
import { getBusinessSettings, getCommunicationSettings, getPublicFaqs } from "@/public/data";

export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  const [business, communication, faqs] = await Promise.all([getBusinessSettings(), getCommunicationSettings(), getPublicFaqs()]);

  return (
    <PageShell business={business} communication={communication}>
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <h1 className="text-5xl font-semibold tracking-[-0.05em]">FAQs</h1>
        <div className="mt-8 space-y-4">
          {faqs.map((faq) => (
            <article key={faq.id} className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">{faq.question}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
