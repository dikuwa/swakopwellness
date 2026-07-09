"use server";

import { hasPermission, requireAuth, requirePermission } from "@/auth/session";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { businessSettings, communicationSettings, bookingRules, documentNumberSequences, documentPredefinedItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordActivity } from "@/activity-log/record";

async function requirePredefinedItemPermission() {
  const user = await requireAuth();
  if (!hasPermission(user.permissions, "settings:manage") && !hasPermission(user.permissions, "services:manage")) {
    redirect("/dashboard/denied");
  }
  return user;
}

export async function updateBusinessSettings(formData: FormData) {
  const user = await requirePermission("settings:manage");
  try {
    const db = getDb();
    const businessName = formData.get("businessName") as string;
    const address = formData.get("address") as string;
    const telephone = formData.get("telephone") as string;
    const email = formData.get("email") as string;
    const operatingHours = formData.get("operatingHours") as string;
    const appointmentModel = (formData.get("appointmentModel") as string) || "By appointment only";
    const medicalDisclaimer = formData.get("medicalDisclaimer") as string;
    const technologyImageId = (formData.get("technologyImageId") as string) || null;

    const registrationNumber = formData.get("registrationNumber") as string;
    const taxNumber = formData.get("taxNumber") as string;
    const bankingDetails = formData.get("bankingDetails") as string;
    const footerMessage = formData.get("footerMessage") as string;
    const signatureName = formData.get("signatureName") as string;
    const signatureRole = formData.get("signatureRole") as string;

    const documentDetails: Record<string, unknown> = {
      registrationNumber,
      taxNumber,
      bankingDetails,
      footerMessage,
      signatureName,
      signatureRole,
    };

    const [existing] = await db.select({ id: businessSettings.id }).from(businessSettings).limit(1);
    if (!existing) {
      return { ok: false, error: "Business settings not found. Please seed the database." };
    }

    await db
      .update(businessSettings)
      .set({
        businessName,
        address,
        telephone,
        email,
        operatingHours,
        appointmentModel,
        medicalDisclaimer,
        technologyImageId,
        documentDetails,
        updatedAt: new Date(),
      })
      .where(eq(businessSettings.id, existing.id));

    await recordActivity(user.id, "update_settings", "business_settings", existing.id, "Updated business settings");

    revalidatePath("/dashboard/settings");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update business settings." };
  }
}

export async function updateCommunicationSettings(formData: FormData) {
  const user = await requirePermission("settings:manage");
  try {
    const db = getDb();
    const enableCalls = formData.has("enableCalls");
    const mainPhone = formData.get("mainPhone") as string;
    const enableEmailContact = formData.has("enableEmailContact");
    const businessEmail = formData.get("businessEmail") as string;
    const bookingNotificationEmail = (formData.get("bookingNotificationEmail") as string) || null;
    const acknowledgementEmail = (formData.get("acknowledgementEmail") as string) || null;
    const replyToEmail = (formData.get("replyToEmail") as string) || null;
    const enableWhatsapp = formData.has("enableWhatsapp");
    const whatsappNumber = (formData.get("whatsappNumber") as string) || null;
    const whatsappDefaultMessage = (formData.get("whatsappDefaultMessage") as string) || null;

    const [existing] = await db.select({ id: communicationSettings.id }).from(communicationSettings).limit(1);
    if (!existing) {
      return { ok: false, error: "Communication settings not found. Please seed the database." };
    }

    await db
      .update(communicationSettings)
      .set({
        enableCalls,
        mainPhone,
        enableEmailContact,
        businessEmail,
        bookingNotificationEmail,
        acknowledgementEmail,
        replyToEmail,
        enableWhatsapp,
        whatsappNumber,
        whatsappDefaultMessage,
        updatedAt: new Date(),
      })
      .where(eq(communicationSettings.id, existing.id));

    await recordActivity(user.id, "update_settings", "communication_settings", existing.id, "Updated communication settings");

    revalidatePath("/dashboard/settings");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update communication settings." };
  }
}

export async function updateBookingRules(formData: FormData) {
  const user = await requirePermission("settings:manage");
  try {
    const db = getDb();
    const openingTime = formData.get("openingTime") as string;
    const closingTime = formData.get("closingTime") as string;
    const timezone = formData.get("timezone") as string;
    const requestMode = formData.get("requestMode") as string;
    const duplicateWindowMinutes = Number.parseInt(formData.get("duplicateWindowMinutes") as string, 10);

    if (!openingTime || !closingTime) {
      return { ok: false, error: "Opening and closing times are required." };
    }
    if (!timezone) {
      return { ok: false, error: "Timezone is required." };
    }
    if (!requestMode) {
      return { ok: false, error: "Request mode is required." };
    }
    if (Number.isNaN(duplicateWindowMinutes) || duplicateWindowMinutes < 0) {
      return { ok: false, error: "Duplicate window must be a non-negative number." };
    }

    const [existing] = await db.select({ id: bookingRules.id }).from(bookingRules).limit(1);
    if (!existing) {
      return { ok: false, error: "Booking rules not found. Please seed the database." };
    }

    await db
      .update(bookingRules)
      .set({
        openingTime,
        closingTime,
        timezone,
        requestMode,
        duplicateWindowMinutes,
        updatedAt: new Date(),
      })
      .where(eq(bookingRules.id, existing.id));

    await recordActivity(user.id, "update_settings", "booking_rules", existing.id, "Updated booking rules");

    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update booking rules." };
  }
}

export async function updateDocumentSequence(formData: FormData) {
  const user = await requirePermission("settings:manage");
  try {
    const db = getDb();
    const documentType = formData.get("documentType") as string;
    const prefix = formData.get("prefix") as string;
    const nextNumber = Number.parseInt(formData.get("nextNumber") as string, 10);
    const padding = Number.parseInt(formData.get("padding") as string, 10);

    if (!documentType) {
      return { ok: false, error: "Document type is required." };
    }
    if (Number.isNaN(nextNumber) || nextNumber < 1) {
      return { ok: false, error: "Next number must be a positive integer." };
    }
    if (Number.isNaN(padding) || padding < 1) {
      return { ok: false, error: "Padding must be a positive integer." };
    }

    const [existing] = await db
      .select({ id: documentNumberSequences.id })
      .from(documentNumberSequences)
      .where(eq(documentNumberSequences.documentType, documentType))
      .limit(1);

    if (!existing) {
      return { ok: false, error: `Document sequence for "${documentType}" not found.` };
    }

    await db
      .update(documentNumberSequences)
      .set({ prefix, nextNumber, padding, updatedAt: new Date() })
      .where(eq(documentNumberSequences.id, existing.id));

    await recordActivity(user.id, "update_settings", "document_number_sequence", existing.id, `Updated ${documentType} numbering sequence`);

    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update document sequence." };
  }
}

const itemTypes = new Set(["service", "product", "fee", "discount", "other"]);

function moneyToCents(value: FormDataEntryValue | null) {
  return Math.round((Number.parseFloat(String(value ?? "0")) || 0) * 100);
}

function parsePredefinedItem(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || label;
  const itemType = String(formData.get("itemType") ?? "other");
  const unitPriceCents = moneyToCents(formData.get("unitPrice"));
  const sortOrder = Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0;
  const active = formData.get("active") === "on";

  if (label.length < 2) return { ok: false as const, error: "Item label is required." };
  if (!itemTypes.has(itemType)) return { ok: false as const, error: "Choose a valid item type." };
  if (unitPriceCents < 0) return { ok: false as const, error: "Price cannot be negative." };

  return { ok: true as const, data: { label, description, itemType, unitPriceCents, sortOrder, active } };
}

export async function createDocumentPredefinedItem(formData: FormData) {
  const user = await requirePredefinedItemPermission();
  try {
    const parsed = parsePredefinedItem(formData);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    const db = getDb();
    const [item] = await db.insert(documentPredefinedItems).values(parsed.data).returning({ id: documentPredefinedItems.id });
    await recordActivity(user.id, "document_predefined_item.created", "document_predefined_item", item.id, `Created predefined item ${parsed.data.label}`);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/services/additional-items");
    revalidatePath("/dashboard/documents");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create predefined item." };
  }
}

export async function updateDocumentPredefinedItem(formData: FormData) {
  const user = await requirePredefinedItemPermission();
  try {
    const id = String(formData.get("id") ?? "");
    if (!id) return { ok: false, error: "Item ID is required." };
    const parsed = parsePredefinedItem(formData);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    const db = getDb();
    await db.update(documentPredefinedItems).set({ ...parsed.data, updatedAt: new Date() }).where(eq(documentPredefinedItems.id, id));
    await recordActivity(user.id, "document_predefined_item.updated", "document_predefined_item", id, `Updated predefined item ${parsed.data.label}`);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/services/additional-items");
    revalidatePath("/dashboard/documents");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update predefined item." };
  }
}

export async function deleteDocumentPredefinedItem(formData: FormData) {
  const user = await requirePredefinedItemPermission();
  try {
    const id = String(formData.get("id") ?? "");
    if (!id) return { ok: false, error: "Item ID is required." };
    const db = getDb();
    const [item] = await db.select({ label: documentPredefinedItems.label }).from(documentPredefinedItems).where(eq(documentPredefinedItems.id, id)).limit(1);
    if (!item) return { ok: false, error: "Predefined item not found." };
    await db.delete(documentPredefinedItems).where(eq(documentPredefinedItems.id, id));
    await recordActivity(user.id, "document_predefined_item.deleted", "document_predefined_item", id, `Deleted predefined item ${item.label}`);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/services/additional-items");
    revalidatePath("/dashboard/documents");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete predefined item." };
  }
}
