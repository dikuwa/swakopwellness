import { getDb } from "@/db/client";
import { activityLog } from "@/db/schema";

export function recordActivity(
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId: string | undefined,
  summary: string,
  metadata?: Record<string, unknown>,
) {
  const db = getDb();
  return db.insert(activityLog).values({ userId: userId ?? null, action, entityType, entityId: entityId ?? null, summary, metadata: metadata ?? null }).execute();
}
