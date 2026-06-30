"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { receipts } from "@/db/schema";
import { requirePermission } from "@/auth/session";
import { recordActivity } from "@/activity-log/record";

export async function voidReceiptAction(receiptId: string, formData: FormData) {
  const user = await requirePermission("documents:void");
  const reason = formData.get("reason") as string;

  if (!reason || reason.trim().length === 0) {
    throw new Error("Void reason is required.");
  }

  const db = getDb();

  const [receipt] = await db
    .select({ receiptNumber: receipts.receiptNumber, amountCents: receipts.amountCents })
    .from(receipts)
    .where(eq(receipts.id, receiptId))
    .limit(1);

  if (!receipt) {
    throw new Error("Receipt not found.");
  }

  await db
    .update(receipts)
    .set({ voidedAt: new Date(), voidReason: reason.trim() })
    .where(eq(receipts.id, receiptId));

  await recordActivity(
    user.id,
    "receipt.voided",
    "receipt",
    receiptId,
    `Receipt ${receipt.receiptNumber} for N$${(receipt.amountCents / 100).toFixed(2)} voided: ${reason.trim()}`,
  );

  revalidatePath(`/dashboard/receipts/${receiptId}`);
}
