import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documentPredefinedItems } from "@/db/schema";

export type DocumentPredefinedItem = {
  id: string;
  label: string;
  description: string;
  itemType: string;
  unitPriceCents: number;
  sortOrder: number;
  active: boolean;
};

const defaultItems = [
  { label: "Consultation add-on", description: "Consultation add-on", itemType: "service", unitPriceCents: 25000, sortOrder: 10 },
  { label: "Supplement", description: "Supplement", itemType: "product", unitPriceCents: 18000, sortOrder: 20 },
  { label: "Transport", description: "Transport", itemType: "fee", unitPriceCents: 15000, sortOrder: 30 },
  { label: "Admin fee", description: "Admin fee", itemType: "fee", unitPriceCents: 10000, sortOrder: 40 },
  { label: "Late cancellation", description: "Late cancellation", itemType: "fee", unitPriceCents: 20000, sortOrder: 50 },
  { label: "Custom wellness support", description: "Custom wellness support", itemType: "other", unitPriceCents: 30000, sortOrder: 60 },
];

export async function ensureDefaultPredefinedItems() {
  const db = getDb();
  const [existing] = await db.select({ id: documentPredefinedItems.id }).from(documentPredefinedItems).limit(1);
  if (existing) return;
  await db.insert(documentPredefinedItems).values(defaultItems);
}

export async function getDocumentPredefinedItems({ activeOnly = false }: { activeOnly?: boolean } = {}): Promise<DocumentPredefinedItem[]> {
  await ensureDefaultPredefinedItems();
  const db = getDb();
  return db
    .select()
    .from(documentPredefinedItems)
    .where(activeOnly ? eq(documentPredefinedItems.active, true) : undefined)
    .orderBy(asc(documentPredefinedItems.sortOrder), asc(documentPredefinedItems.label));
}
