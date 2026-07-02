import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { followUps } from "@/db/schema";
import { sendFollowUpReminder } from "@/email/send";

type SchedulerResult = {
  ok: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
};

export async function processDueFollowUpReminders(now = new Date()): Promise<SchedulerResult> {
  const db = getDb();

  const dueStatuses: (typeof followUps.$inferSelect.status)[] = ["pending", "due_today", "overdue"];

  const dueFollowUps = await db
    .select({ id: followUps.id, status: followUps.status })
    .from(followUps)
    .where(
      and(
        inArray(followUps.status, dueStatuses),
        lte(followUps.dueAt, now),
        sql`(${followUps.reminderAt} IS NULL OR ${followUps.dueAt} >= ${followUps.reminderAt})`,
      ),
    )
    .orderBy(followUps.dueAt);

  if (dueFollowUps.length === 0) {
    return { ok: true, processed: 0, succeeded: 0, failed: 0, errors: [] };
  }

  const result: SchedulerResult = { ok: true, processed: 0, succeeded: 0, failed: 0, errors: [] };

  for (const fup of dueFollowUps) {
    result.processed += 1;
    try {
      const emailResult = await sendFollowUpReminder(fup.id);
      if (emailResult.ok) {
        await db
          .update(followUps)
          .set({ reminderAt: now, updatedAt: now })
          .where(eq(followUps.id, fup.id));
        result.succeeded += 1;
      } else {
        result.failed += 1;
        result.errors.push(`Follow-up ${fup.id}: ${emailResult.error}`);
      }
    } catch (err) {
      result.failed += 1;
      const msg = err instanceof Error ? err.message : "Unknown error";
      result.errors.push(`Follow-up ${fup.id}: ${msg}`);
    }
  }

  if (result.failed > 0) result.ok = false;
  return result;
}
