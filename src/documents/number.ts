import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documentNumberSequences } from "@/db/schema";

export type DocumentType = "invoice" | "receipt" | "quotation";

export async function ensureDocumentSequence(type: DocumentType, prefix: string, padding = 5) {
  const db = getDb();
  const [existing] = await db.select().from(documentNumberSequences).where(eq(documentNumberSequences.documentType, type)).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(documentNumberSequences)
    .values({ documentType: type, prefix, nextNumber: 1, padding })
    .returning();
  return created;
}

export async function getNextDocumentNumber(type: DocumentType): Promise<string> {
  const db = getDb();
  const [seq] = await db
    .select()
    .from(documentNumberSequences)
    .where(eq(documentNumberSequences.documentType, type))
    .limit(1);
  if (!seq) throw new Error(`No number sequence configured for ${type}`);
  const nextNum = seq.nextNumber;
  const padded = String(nextNum).padStart(seq.padding, "0");
  const numberStr = `${seq.prefix}${padded}`;
  await db
    .update(documentNumberSequences)
    .set({ nextNumber: nextNum + 1, updatedAt: new Date() })
    .where(eq(documentNumberSequences.id, seq.id));
  return numberStr;
}
