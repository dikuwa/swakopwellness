export const bookingStatuses = [
  "new_request",
  "requires_review",
  "contacting_client",
  "awaiting_client_response",
  "confirmed",
  "rescheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

export function getInitialBookingStatus(hasFlaggedSuitability: boolean, hasScheduleConflict = false): BookingStatus {
  return hasFlaggedSuitability || hasScheduleConflict ? "requires_review" : "new_request";
}

export const validTransitions: Record<string, string[]> = {
  new_request: ["requires_review", "confirmed", "cancelled"],
  requires_review: ["contacting_client", "confirmed", "cancelled"],
  contacting_client: ["awaiting_client_response", "confirmed", "cancelled"],
  awaiting_client_response: ["confirmed", "cancelled"],
  confirmed: ["rescheduled", "completed", "cancelled", "no_show"],
  rescheduled: ["confirmed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function getAvailableActions(status: string): string[] {
  return validTransitions[status] ?? [];
}
