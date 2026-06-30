export const followUpStatuses = ["pending", "due_today", "overdue", "completed", "cancelled"] as const;

export type FollowUpStatus = (typeof followUpStatuses)[number];

export function getFollowUpDisplayStatus(dueAt: Date, now = new Date(), storedStatus: FollowUpStatus = "pending"): FollowUpStatus {
  if (storedStatus === "completed" || storedStatus === "cancelled") return storedStatus;

  const dueDate = dueAt.toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  if (dueDate < today) return "overdue";
  if (dueDate === today) return "due_today";
  return "pending";
}

export function formatFollowUpStatus(status: FollowUpStatus) {
  return status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
