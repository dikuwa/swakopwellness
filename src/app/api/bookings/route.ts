import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/auth/session";
import { getActiveBookingOptions, getBookingCharges } from "@/lib/models/document";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.permissions, "bookings:view")) {
    return NextResponse.json({ error: "You are not authorised to view bookings." }, { status: 403 });
  }

  const url = new URL(request.url);
  const bookingId = url.searchParams.get("bookingId");

  if (bookingId) {
    const charges = await getBookingCharges(bookingId);
    if (!charges) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    return NextResponse.json(charges);
  }

  const bookings = await getActiveBookingOptions();
  return NextResponse.json({ bookings });
}
