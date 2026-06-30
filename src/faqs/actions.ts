"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/auth/session";
import { getDb } from "@/db/client";
import { faqs } from "@/db/schema";
import { recordActivity } from "@/activity-log/record";

export async function createFaq(data: FormData) {
  const user = await requireAuth();
  const db = getDb();

  const question = (data.get("question") as string)?.trim();
  if (!question) return { ok: false as const, error: "Question is required." };

  const answer = (data.get("answer") as string)?.trim();
  if (!answer) return { ok: false as const, error: "Answer is required." };

  const sortOrderInput = parseInt(data.get("sortOrder") as string);
  let sortOrder = isNaN(sortOrderInput) ? null : sortOrderInput;

  if (sortOrder === null) {
    const [max] = await db
      .select({ maxSort: sql<number>`coalesce(max(${faqs.sortOrder}), -1) + 1` })
      .from(faqs);
    sortOrder = max?.maxSort ?? 0;
  }

  const publicVisible = data.get("publicVisible") === "on";

  try {
    const [faq] = await db
      .insert(faqs)
      .values({ question, answer, sortOrder, publicVisible })
      .returning({ id: faqs.id });

    await recordActivity(
      user.id,
      "create",
      "faq",
      faq.id,
      `Created FAQ: "${question.substring(0, 60)}"`,
    );

    revalidatePath("/dashboard/faqs");
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create FAQ.";
    return { ok: false as const, error: message };
  }
}

export async function updateFaq(id: string, data: FormData) {
  const user = await requireAuth();
  const db = getDb();

  const question = (data.get("question") as string)?.trim();
  if (!question) return { ok: false as const, error: "Question is required." };

  const answer = (data.get("answer") as string)?.trim();
  if (!answer) return { ok: false as const, error: "Answer is required." };

  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;
  const publicVisible = data.get("publicVisible") === "on";

  try {
    await db
      .update(faqs)
      .set({ question, answer, sortOrder, publicVisible, updatedAt: new Date() })
      .where(eq(faqs.id, id));

    await recordActivity(
      user.id,
      "update",
      "faq",
      id,
      `Updated FAQ: "${question.substring(0, 60)}"`,
    );

    revalidatePath("/dashboard/faqs");
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update FAQ.";
    return { ok: false as const, error: message };
  }
}

export async function deleteFaq(id: string) {
  const user = await requireAuth();
  const db = getDb();

  const [faq] = await db
    .delete(faqs)
    .where(eq(faqs.id, id))
    .returning({ question: faqs.question });

  if (faq) {
    await recordActivity(
      user.id,
      "delete",
      "faq",
      id,
      `Deleted FAQ: "${faq.question.substring(0, 60)}"`,
    );
  }

  revalidatePath("/dashboard/faqs");
}

export async function toggleFaqPublic(id: string) {
  const user = await requireAuth();
  const db = getDb();

  const [current] = await db
    .select({ publicVisible: faqs.publicVisible, question: faqs.question })
    .from(faqs)
    .where(eq(faqs.id, id))
    .limit(1);

  if (current) {
    await db
      .update(faqs)
      .set({ publicVisible: !current.publicVisible, updatedAt: new Date() })
      .where(eq(faqs.id, id));

    await recordActivity(
      user.id,
      "update",
      "faq",
      id,
      `Made FAQ "${current.question.substring(0, 60)}" ${current.publicVisible ? "private" : "public"}`,
    );
  }

  revalidatePath("/dashboard/faqs");
}

export async function reorderFaqs(ids: string[], data: FormData) {
  await requireAuth();
  const db = getDb();

  const faqId = data.get("faqId") as string;
  const direction = data.get("direction") as string;

  const newIds = [...ids];
  const idx = newIds.indexOf(faqId);

  if (direction === "up" && idx > 0) {
    [newIds[idx - 1], newIds[idx]] = [newIds[idx], newIds[idx - 1]];
  } else if (direction === "down" && idx < newIds.length - 1) {
    [newIds[idx], newIds[idx + 1]] = [newIds[idx + 1], newIds[idx]];
  }

  for (let i = 0; i < newIds.length; i++) {
    await db
      .update(faqs)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(eq(faqs.id, newIds[i]));
  }

  revalidatePath("/dashboard/faqs");
}
