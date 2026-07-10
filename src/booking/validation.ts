import { z } from "zod";
import { parseBusinessDateTime } from "@/lib/business-time";

export const contactMethods = ["phone", "email", "whatsapp"] as const;
export const clientTypes = ["new", "returning"] as const;

export const bookingRequestSchema = z.object({
  serviceId: z.string().uuid(),
  preferredDate: z.string().min(1),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
  alternativeDate: z.string().optional(),
  alternativeTime: z.string().optional(),
  fullName: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  whatsappNumber: z.string().trim().optional(),
  clientType: z.enum(clientTypes),
  preferredContactMethod: z.enum(contactMethods),
  note: z.string().trim().max(1000).optional(),
  answers: z.record(z.string().uuid(), z.enum(["yes", "no"])).default({}),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export function parseDateTime(date: string, time: string) {
  return parseBusinessDateTime(date, time);
}

export function hasAtLeastOneContact(input: Pick<BookingRequestInput, "phone" | "email" | "whatsappNumber">) {
  return Boolean(input.phone?.trim() || input.email?.trim() || input.whatsappNumber?.trim());
}

export function isContactMethodAvailable(method: BookingRequestInput["preferredContactMethod"], flags: { enableCalls: boolean; enableEmailContact: boolean; enableWhatsapp: boolean }) {
  if (method === "phone") return flags.enableCalls;
  if (method === "email") return flags.enableEmailContact;
  return flags.enableWhatsapp;
}
