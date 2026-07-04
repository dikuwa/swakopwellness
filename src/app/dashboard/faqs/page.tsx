import Link from "next/link";
import type { Metadata } from "next";
import { ChevronUp, ChevronDown } from "lucide-react";
import { asc } from "drizzle-orm";
import { requireAuth } from "@/auth/session";
import { getDb } from "@/db/client";
import { faqs } from "@/db/schema";
import { DashboardShell } from "@/dashboard/shell";
import { deleteFaq, toggleFaqPublic, reorderFaqs } from "@/faqs/actions";

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

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">
            FAQs
          </h1>
        </div>
          <Link
            href="/dashboard/faqs/new"
            className="flex h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface-muted"
          >
            New FAQ
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-3">Question</th>
                <th>Answer</th>
                <th>Sort</th>
                <th>Public</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allFaqs.map((faq, index) => (
                <tr
                  key={faq.id}
                  className="border-t border-border hover:bg-surface-muted/50"
                >
                  <td className="max-w-[240px] truncate py-3 font-medium">
                    {faq.question.length > 60
                      ? `${faq.question.substring(0, 60)}\u2026`
                      : faq.question}
                  </td>
                  <td className="max-w-[300px] truncate text-muted-foreground">
                    {faq.answer.length > 80
                      ? `${faq.answer.substring(0, 80)}\u2026`
                      : faq.answer}
                  </td>
                  <td className="text-muted-foreground">{faq.sortOrder}</td>
                  <td>
                    <form action={toggleFaqPublic.bind(null, faq.id)}>
                      <button
                        type="submit"
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          faq.publicVisible
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {faq.publicVisible ? "Yes" : "No"}
                      </button>
                    </form>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/faqs/${faq.id}/edit`}
                        className="flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-muted"
                      >
                        Edit
                      </Link>
                      <form action={deleteFaq.bind(null, faq.id)}>
                        <button
                          type="submit"
                          className="flex h-8 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                      {index > 0 && (
                        <form action={reorderFaqs.bind(null, faqIds)}>
                          <input type="hidden" name="faqId" value={faq.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            type="submit"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-xs transition-colors hover:bg-surface-muted"
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                      {index < allFaqs.length - 1 && (
                        <form action={reorderFaqs.bind(null, faqIds)}>
                          <input type="hidden" name="faqId" value={faq.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-xs transition-colors hover:bg-surface-muted"
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {allFaqs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No FAQs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </DashboardShell>
  );
}
