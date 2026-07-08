import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { requireAuth } from "@/auth/session";
import { getDb } from "@/db/client";
import { faqs } from "@/db/schema";
import { updateFaq } from "@/faqs/actions";
import { FaqForm } from "../../faq-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit FAQ — Dashboard",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFaqPage({ params }: PageProps) {
  await requireAuth();
  const db = getDb();

  const { id } = await params;

  const [faq] = await db
    .select()
    .from(faqs)
    .where(eq(faqs.id, id))
    .limit(1);

  if (!faq) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
        <section className="mx-auto max-w-4xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
          <p className="text-muted-foreground">FAQ not found.</p>
        </section>
      </main>
    );
  }

  return (
    <FaqForm
      action={updateFaq.bind(null, id)}
      initialData={{
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
        publicVisible: faq.publicVisible,
      }}
    />
  );
}
