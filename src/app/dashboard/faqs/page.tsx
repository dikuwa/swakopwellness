import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { asc } from "drizzle-orm";
import { requireAuth } from "@/auth/session";
import { getDb } from "@/db/client";
import { faqs } from "@/db/schema";
import { DashboardShell } from "@/dashboard/shell";
import { deleteFaq, toggleFaqPublic, reorderFaqs } from "@/faqs/actions";
import { FaqDeleteButton, FaqMoveButton, FaqVisibilityButton } from "./faq-row-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQs — Swakop Wellness Centre",
};

export default async function FaqsPage() {
  await requireAuth();
  const db = getDb();

  const allFaqs = await db
    .select()
    .from(faqs)
    .orderBy(asc(faqs.sortOrder));

  const faqIds = allFaqs.map((f) => f.id);
  const totalFaqs = allFaqs.length;
  const publicFaqs = allFaqs.filter((f) => f.publicVisible).length;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">FAQs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage frequently asked questions and their visibility on the client website.</p>
        </div>
        <Link
          href="/dashboard/faqs/new"
          className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New FAQ
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-3 max-w-md">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="text-lg font-bold">{totalFaqs}</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-sm font-bold tracking-tight mt-0.5">FAQs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <span className="text-lg font-bold">{publicFaqs}</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Public</p>
            <p className="text-sm font-bold tracking-tight mt-0.5">FAQs</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
        </div>
        {allFaqs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No FAQs yet. Create your first FAQ to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Question</th>
                  <th className="py-3 px-4 font-semibold">Answer</th>
                  <th className="py-3 px-4 font-semibold text-center">Sort</th>
                  <th className="py-3 px-4 font-semibold">Visibility</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allFaqs.map((faq, index) => (
                  <tr key={faq.id} className="hover:bg-surface-muted/30 transition-colors">
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <span className="font-medium truncate block">
                        {faq.question.length > 60
                          ? `${faq.question.substring(0, 60)}\u2026`
                          : faq.question}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[300px] text-muted-foreground">
                      <span className="truncate block">
                        {faq.answer.length > 80
                          ? `${faq.answer.substring(0, 80)}\u2026`
                          : faq.answer}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-muted-foreground font-mono text-xs">
                      {faq.sortOrder}
                    </td>
                    <td className="py-3.5 px-4">
                      <form action={toggleFaqPublic.bind(null, faq.id)}>
                        <FaqVisibilityButton visible={faq.publicVisible} />
                      </form>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/faqs/${faq.id}/edit`}
                          className="flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-muted"
                        >
                          Edit
                        </Link>
                        <form action={deleteFaq.bind(null, faq.id)}>
                          <FaqDeleteButton />
                        </form>
                        {index > 0 && (
                          <form action={reorderFaqs.bind(null, faqIds)}>
                            <input type="hidden" name="faqId" value={faq.id} />
                            <input type="hidden" name="direction" value="up" />
                            <FaqMoveButton direction="up" />
                          </form>
                        )}
                        {index < allFaqs.length - 1 && (
                          <form action={reorderFaqs.bind(null, faqIds)}>
                            <input type="hidden" name="faqId" value={faq.id} />
                            <input type="hidden" name="direction" value="down" />
                            <FaqMoveButton direction="down" />
                          </form>
                        )}
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
