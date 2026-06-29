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

export function getInitialBookingStatus(hasFlaggedSuitability: boolean): BookingStatus {
  return hasFlaggedSuitability ? "requires_review" : "new_request";
}
