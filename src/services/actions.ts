"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import {
  bookings,
  documentLineItems,
  invoiceLineItems,
  mediaAssets,
  quotationLineItems,
  receiptLineItems,
  serviceCategories,
  serviceFaqs,
  serviceImages,
  serviceQuestions,
  services,
} from "@/db/schema";
import { recordActivity } from "@/activity-log/record";
import { deleteFile, uploadFile } from "@/lib/storage";

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function revalidateServiceManagement() {
  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/chat");
  revalidatePath("/services");
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/services/categories");
  revalidatePath("/dashboard/services/suitability");
  revalidatePath("/dashboard/bookings/new");
}

export async function createService(data: FormData) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const name = (data.get("name") as string)?.trim();
  if (!name) return { ok: false as const, error: "Name is required." };

  const slug = (data.get("slug") as string)?.trim() || generateSlug(name);
  const categoryId = (data.get("categoryId") as string) || null;
  const shortDescription = (data.get("shortDescription") as string) || "";
  const fullDescription = (data.get("fullDescription") as string) || "";
  const priceInput = parseFloat(data.get("price") as string) || 0;
  const priceCents = Math.round(priceInput * 100);
  const durationMinutes = parseInt(data.get("duration") as string) || null;
  const benefitsRaw = (data.get("benefits") as string) || "";
  const benefits = benefitsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const whatToExpect = (data.get("whatToExpect") as string) || null;
  const preparation = (data.get("preparation") as string) || null;
  const safetyInformation = (data.get("safetyInformation") as string) || null;
  const publicVisible = data.get("publicVisible") === "on";
  const bookingEnabled = data.get("bookingEnabled") === "on";
  const featured = data.get("featured") === "on";
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;

  try {
    const [service] = await db
      .insert(services)
      .values({
        name,
        slug,
        categoryId,
        shortDescription,
        fullDescription,
        priceCents,
        durationMinutes,
        benefits,
        whatToExpect,
        preparation,
        safetyInformation,
        publicVisible,
        bookingEnabled,
        featured,
        sortOrder,
        active: true,
      })
      .returning({ id: services.id });

    // Upload gallery images and create FAQ entries
    if (service) {
      // Handle gallery file uploads
      const galleryFiles = data.getAll("galleryFile") as File[];
      if (galleryFiles.length > 0 && galleryFiles[0].size > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
          const file = galleryFiles[i];
          if (!file || file.size === 0) continue;
          try {
            const ext = file.name.split(".").pop() || "bin";
            const key = `media/${crypto.randomUUID()}.${ext}`;
            const buffer = Buffer.from(await file.arrayBuffer());
            const u8 = new Uint8Array(buffer);
            const publicUrl = await uploadFile(key, u8, file.type);

            const [asset] = await db
              .insert(mediaAssets)
              .values({
                storageKey: key,
                publicUrl,
                mimeType: file.type,
                byteSize: file.size,
                altText: file.name.split(".")[0] || null,
              })
              .returning({ id: mediaAssets.id });

            if (asset) {
              await db.insert(serviceImages).values({
                serviceId: service.id,
                mediaAssetId: asset.id,
                sortOrder: i,
              });

              // First image becomes the featured image
              if (i === 0) {
                await db
                  .update(services)
                  .set({ featuredImageId: asset.id, updatedAt: new Date() })
                  .where(eq(services.id, service.id));
              }
            }
          } catch {
            // Continue with other files on failure
          }
        }
      }

      // Handle FAQ entries
      const faqQuestions = data.getAll("faqQuestion") as string[];
      const faqAnswers = data.getAll("faqAnswer") as string[];
      if (faqQuestions.length > 0 && faqQuestions[0]?.trim()) {
        for (let i = 0; i < faqQuestions.length; i++) {
          const question = faqQuestions[i]?.trim();
          const answer = faqAnswers[i]?.trim();
          if (!question || !answer) continue;
          try {
            await db.insert(serviceFaqs).values({
              serviceId: service.id,
              question,
              answer,
              sortOrder: i,
              active: true,
            });
          } catch {
            // Continue on failure
          }
        }
      }
    }

    await recordActivity(
      user.id,
      "create",
      "service",
      service.id,
      `Created service "${name}"`,
    );

    revalidateServiceManagement();

    return { ok: true as const, serviceId: service.id };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create service.";
    return { ok: false as const, error: message };
  }
}

export async function updateService(id: string, data: FormData) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const name = (data.get("name") as string)?.trim() || "";
  const slug = (data.get("slug") as string)?.trim() || generateSlug(name);
  const categoryId = (data.get("categoryId") as string) || null;
  const shortDescription = (data.get("shortDescription") as string) || "";
  const fullDescription = (data.get("fullDescription") as string) || "";
  const priceInput = parseFloat(data.get("price") as string) || 0;
  const priceCents = Math.round(priceInput * 100);
  const durationMinutes = parseInt(data.get("duration") as string) || null;
  const benefitsRaw = (data.get("benefits") as string) || "";
  const benefits = benefitsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const whatToExpect = (data.get("whatToExpect") as string) || null;
  const preparation = (data.get("preparation") as string) || null;
  const safetyInformation = (data.get("safetyInformation") as string) || null;
  const publicVisible = data.get("publicVisible") === "on";
  const bookingEnabled = data.get("bookingEnabled") === "on";
  const featured = data.get("featured") === "on";
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;
  const featuredImageId = (data.get("featuredImageId") as string) || null;

  try {
    await db
      .update(services)
      .set({
        name,
        slug,
        categoryId,
        shortDescription,
        fullDescription,
        priceCents,
        durationMinutes,
        benefits,
        whatToExpect,
        preparation,
        safetyInformation,
        publicVisible,
        bookingEnabled,
        featured,
        sortOrder,
        // featuredImageId is managed by gallery server actions — do not overwrite from form
        updatedAt: new Date(),
      })
      .where(eq(services.id, id));

    await recordActivity(
      user.id,
      "update",
      "service",
      id,
      `Updated service "${name}"`,
    );

    revalidateServiceManagement();

    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update service.";
    return { ok: false as const, error: message };
  }
}

export async function archiveService(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [existing] = await db
    .select({ name: services.name })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (!existing) {
    revalidateServiceManagement();
    return;
  }

  const [bookingRef, invoiceRef, quotationRef, receiptRef, documentRef] = await Promise.all([
    db.select({ id: bookings.id }).from(bookings).where(eq(bookings.serviceId, id)).limit(1),
    db.select({ id: invoiceLineItems.id }).from(invoiceLineItems).where(eq(invoiceLineItems.serviceId, id)).limit(1),
    db.select({ id: quotationLineItems.id }).from(quotationLineItems).where(eq(quotationLineItems.serviceId, id)).limit(1),
    db.select({ id: receiptLineItems.id }).from(receiptLineItems).where(eq(receiptLineItems.serviceId, id)).limit(1),
    db.select({ id: documentLineItems.id }).from(documentLineItems).where(eq(documentLineItems.serviceId, id)).limit(1),
  ]);

  const hasHistoricalReferences =
    bookingRef.length > 0 ||
    invoiceRef.length > 0 ||
    quotationRef.length > 0 ||
    receiptRef.length > 0 ||
    documentRef.length > 0;

  if (hasHistoricalReferences) {
    await db
      .update(services)
      .set({
        archivedAt: new Date(),
        active: false,
        publicVisible: false,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id));

    await recordActivity(
      user.id,
      "archive",
      "service",
      id,
      `Archived service "${existing.name}"`,
    );
  } else {
    await db.delete(services).where(eq(services.id, id));

    await recordActivity(
      user.id,
      "delete",
      "service",
      id,
      `Deleted service "${existing.name}"`,
    );
  }

  revalidateServiceManagement();
}

export async function toggleServiceActive(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [current] = await db
    .select({ active: services.active, name: services.name })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (current) {
    await db
      .update(services)
      .set({ active: !current.active, updatedAt: new Date() })
      .where(eq(services.id, id));

    await recordActivity(
      user.id,
      "update",
      "service",
      id,
      `${current.active ? "Deactivated" : "Activated"} service "${current.name}"`,
    );
  }

  revalidateServiceManagement();
}

export async function toggleServicePublic(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [current] = await db
    .select({ publicVisible: services.publicVisible, name: services.name })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (current) {
    await db
      .update(services)
      .set({ publicVisible: !current.publicVisible, updatedAt: new Date() })
      .where(eq(services.id, id));

    await recordActivity(
      user.id,
      "update",
      "service",
      id,
      `Made service "${current.name}" ${current.publicVisible ? "private" : "public"}`,
    );
  }

  revalidateServiceManagement();
}


export async function createServiceCategory(data: FormData) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const name = (data.get("name") as string)?.trim();
  if (!name) return { ok: false as const, error: "Name is required." };

  const slug = (data.get("slug") as string)?.trim() || generateSlug(name);
  const description = (data.get("description") as string)?.trim() || null;
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;

  try {
    const [category] = await db
      .insert(serviceCategories)
      .values({ name, slug, description, sortOrder, active: true })
      .returning({ id: serviceCategories.id });

    await recordActivity(
      user.id,
      "create",
      "service_category",
      category.id,
      `Created service category "${name}"`,
    );

    revalidateServiceManagement();
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create service category.";
    return { ok: false as const, error: message };
  }
}

export async function updateServiceCategory(id: string, data: FormData) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const name = (data.get("name") as string)?.trim();
  if (!name) return { ok: false as const, error: "Name is required." };

  const slug = (data.get("slug") as string)?.trim() || generateSlug(name);
  const description = (data.get("description") as string)?.trim() || null;
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;

  try {
    await db
      .update(serviceCategories)
      .set({ name, slug, description, sortOrder, updatedAt: new Date() })
      .where(eq(serviceCategories.id, id));

    await recordActivity(
      user.id,
      "update",
      "service_category",
      id,
      `Updated service category "${name}"`,
    );

    revalidateServiceManagement();
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update service category.";
    return { ok: false as const, error: message };
  }
}

export async function toggleServiceCategoryActive(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [current] = await db
    .select({ active: serviceCategories.active, name: serviceCategories.name })
    .from(serviceCategories)
    .where(eq(serviceCategories.id, id))
    .limit(1);

  if (current) {
    await db
      .update(serviceCategories)
      .set({ active: !current.active, updatedAt: new Date() })
      .where(eq(serviceCategories.id, id));

    await recordActivity(
      user.id,
      "update",
      "service_category",
      id,
      `${current.active ? "Deactivated" : "Activated"} service category "${current.name}"`,
    );
  }

  revalidateServiceManagement();
}

export async function deleteOrArchiveServiceCategory(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [category] = await db
    .select({ name: serviceCategories.name })
    .from(serviceCategories)
    .where(eq(serviceCategories.id, id))
    .limit(1);

  if (!category) {
    revalidateServiceManagement();
    return;
  }

  const [linkedService] = await db
    .select({ id: services.id })
    .from(services)
    .where(eq(services.categoryId, id))
    .limit(1);

  if (linkedService) {
    await db
      .update(serviceCategories)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(serviceCategories.id, id));

    await recordActivity(
      user.id,
      "archive",
      "service_category",
      id,
      `Archived service category "${category.name}"`,
    );
  } else {
    await db.delete(serviceCategories).where(eq(serviceCategories.id, id));

    await recordActivity(
      user.id,
      "delete",
      "service_category",
      id,
      `Deleted service category "${category.name}"`,
    );
  }

  revalidateServiceManagement();
}

export async function createSuitabilityQuestion(data: FormData) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const question = (data.get("question") as string)?.trim();
  if (!question) return { ok: false as const, error: "Question is required." };

  const serviceId = (data.get("serviceId") as string) || null;
  const flaggedAnswer =
    (data.get("flaggedAnswer") as string)?.trim().toLowerCase() || "yes";
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;

  try {
    const [created] = await db
      .insert(serviceQuestions)
      .values({ question, serviceId, flaggedAnswer, sortOrder, active: true })
      .returning({ id: serviceQuestions.id });

    await recordActivity(
      user.id,
      "create",
      "suitability_question",
      created.id,
      `Created suitability question "${question}"`,
    );

    revalidateServiceManagement();
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create suitability question.";
    return { ok: false as const, error: message };
  }
}

export async function updateSuitabilityQuestion(id: string, data: FormData) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const question = (data.get("question") as string)?.trim();
  if (!question) return { ok: false as const, error: "Question is required." };

  const serviceId = (data.get("serviceId") as string) || null;
  const flaggedAnswer =
    (data.get("flaggedAnswer") as string)?.trim().toLowerCase() || "yes";
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;

  try {
    await db
      .update(serviceQuestions)
      .set({ question, serviceId, flaggedAnswer, sortOrder, updatedAt: new Date() })
      .where(eq(serviceQuestions.id, id));

    await recordActivity(
      user.id,
      "update",
      "suitability_question",
      id,
      `Updated suitability question "${question}"`,
    );

    revalidateServiceManagement();
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update suitability question.";
    return { ok: false as const, error: message };
  }
}

export async function toggleSuitabilityQuestionActive(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [current] = await db
    .select({ active: serviceQuestions.active, question: serviceQuestions.question })
    .from(serviceQuestions)
    .where(eq(serviceQuestions.id, id))
    .limit(1);

  if (current) {
    await db
      .update(serviceQuestions)
      .set({ active: !current.active, updatedAt: new Date() })
      .where(eq(serviceQuestions.id, id));

    await recordActivity(
      user.id,
      "update",
      "suitability_question",
      id,
      `${current.active ? "Deactivated" : "Activated"} suitability question "${current.question}"`,
    );
  }

  revalidateServiceManagement();
}

export async function deleteSuitabilityQuestion(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [question] = await db
    .delete(serviceQuestions)
    .where(eq(serviceQuestions.id, id))
    .returning({ question: serviceQuestions.question });

  if (question) {
    await recordActivity(
      user.id,
      "delete",
      "suitability_question",
      id,
      `Deleted suitability question "${question.question}"`,
    );
  }

  revalidateServiceManagement();
}

export async function createServiceFaq(serviceId: string, data: FormData) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const question = (data.get("question") as string)?.trim();
  const answer = (data.get("answer") as string)?.trim();
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;

  if (!question || !answer) return { ok: false as const, error: "Question and answer are required." };

  const [service] = await db.select({ name: services.name }).from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service) return { ok: false as const, error: "Service not found." };

  const [faq] = await db
    .insert(serviceFaqs)
    .values({ serviceId, question, answer, sortOrder, active: true })
    .returning({ id: serviceFaqs.id });

  await recordActivity(user.id, "create", "service_faq", faq.id, `Created FAQ for service "${service.name}"`);
  revalidateServiceManagement();
  revalidatePath(`/dashboard/services/${serviceId}/edit`);
  return { ok: true as const };
}

export async function updateServiceFaq(id: string, data: FormData) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const question = (data.get("question") as string)?.trim();
  const answer = (data.get("answer") as string)?.trim();
  const sortOrder = parseInt(data.get("sortOrder") as string) || 0;

  if (!question || !answer) return { ok: false as const, error: "Question and answer are required." };

  const [faq] = await db
    .update(serviceFaqs)
    .set({ question, answer, sortOrder, updatedAt: new Date() })
    .where(eq(serviceFaqs.id, id))
    .returning({ serviceId: serviceFaqs.serviceId });

  if (faq) {
    await recordActivity(user.id, "update", "service_faq", id, `Updated service FAQ "${question}"`);
    revalidatePath(`/dashboard/services/${faq.serviceId}/edit`);
  }

  revalidateServiceManagement();
  return { ok: true as const };
}

export async function toggleServiceFaqActive(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [current] = await db
    .select({ active: serviceFaqs.active, question: serviceFaqs.question, serviceId: serviceFaqs.serviceId })
    .from(serviceFaqs)
    .where(eq(serviceFaqs.id, id))
    .limit(1);

  if (current) {
    await db.update(serviceFaqs).set({ active: !current.active, updatedAt: new Date() }).where(eq(serviceFaqs.id, id));
    await recordActivity(user.id, "update", "service_faq", id, `${current.active ? "Deactivated" : "Activated"} service FAQ "${current.question}"`);
    revalidatePath(`/dashboard/services/${current.serviceId}/edit`);
  }

  revalidateServiceManagement();
}

export async function deleteServiceFaq(id: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [faq] = await db
    .delete(serviceFaqs)
    .where(eq(serviceFaqs.id, id))
    .returning({ question: serviceFaqs.question, serviceId: serviceFaqs.serviceId });

  if (faq) {
    await recordActivity(user.id, "delete", "service_faq", id, `Deleted service FAQ "${faq.question}"`);
    revalidatePath(`/dashboard/services/${faq.serviceId}/edit`);
  }

  revalidateServiceManagement();
}

export async function reorderServiceGalleryImage(serviceId: string, mediaAssetId: string, newSortOrder: number) {
  await requirePermission("services:manage");
  const db = getDb();

  const [current] = await db
    .select({ sortOrder: serviceImages.sortOrder })
    .from(serviceImages)
    .where(and(eq(serviceImages.serviceId, serviceId), eq(serviceImages.mediaAssetId, mediaAssetId)))
    .limit(1);

  if (current) {
    await db
      .update(serviceImages)
      .set({ sortOrder: newSortOrder })
      .where(and(eq(serviceImages.serviceId, serviceId), eq(serviceImages.mediaAssetId, mediaAssetId)));
  }

  // Sync featuredImageId to the first gallery image by sort order
  const [first] = await db
    .select({ mediaAssetId: serviceImages.mediaAssetId })
    .from(serviceImages)
    .where(eq(serviceImages.serviceId, serviceId))
    .orderBy(asc(serviceImages.sortOrder))
    .limit(1);

  await db
    .update(services)
    .set({ featuredImageId: first?.mediaAssetId ?? null, updatedAt: new Date() })
    .where(eq(services.id, serviceId));

  revalidateServiceManagement();
  revalidatePath(`/dashboard/services/${serviceId}/edit`);
}

export async function addServiceGalleryImage(serviceId: string, mediaAssetId: string) {
  await requirePermission("services:manage");
  const db = getDb();

  const existing = await db
    .select({ sortOrder: serviceImages.sortOrder })
    .from(serviceImages)
    .where(eq(serviceImages.serviceId, serviceId))
    .orderBy(desc(serviceImages.sortOrder))
    .limit(1);

  const sortOrder = existing.length > 0 ? existing[0].sortOrder + 1 : 0;

  await db
    .insert(serviceImages)
    .values({ serviceId, mediaAssetId, sortOrder })
    .onConflictDoNothing();

  // Auto-set as featured image if this is the first gallery image
  if (sortOrder === 0) {
    await db
      .update(services)
      .set({ featuredImageId: mediaAssetId, updatedAt: new Date() })
      .where(eq(services.id, serviceId));
  }

  revalidateServiceManagement();
  revalidatePath(`/dashboard/services/${serviceId}/edit`);
}

export async function uploadServiceFeaturedImage(serviceId: string, formData: FormData) {
  const user = await requirePermission("services:manage");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false as const, error: "No file provided." };

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
  const MAX_SIZE = 8 * 1024 * 1024;

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false as const, error: `Unsupported file type: ${file.type}.` };
  }
  if (file.size > MAX_SIZE) {
    return { ok: false as const, error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.` };
  }

  try {
    const ext = file.name.split(".").pop() || "bin";
    const key = `media/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const u8 = new Uint8Array(buffer);
    const publicUrl = await uploadFile(key, u8, file.type);

    const db = getDb();

    const [asset] = await db
      .insert(mediaAssets)
      .values({
        storageKey: key,
        publicUrl,
        mimeType: file.type,
        byteSize: file.size,
        altText: file.name.split(".")[0] || null,
      })
      .returning({ id: mediaAssets.id, publicUrl: mediaAssets.publicUrl });

    if (!asset) return { ok: false as const, error: "Failed to create media asset." };

    await db
      .update(services)
      .set({ featuredImageId: asset.id, updatedAt: new Date() })
      .where(eq(services.id, serviceId));

    await db.insert(serviceImages).values({
      serviceId,
      mediaAssetId: asset.id,
      sortOrder: 0,
    }).onConflictDoNothing();

    await recordActivity(user.id, "update", "service", serviceId, `Updated service featured image`);

    revalidateServiceManagement();
    revalidatePath(`/dashboard/services/${serviceId}/edit`);

    return { ok: true as const, publicUrl: asset.publicUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image.";
    return { ok: false as const, error: message };
  }
}

export async function removeServiceFeaturedImage(serviceId: string) {
  const user = await requirePermission("services:manage");
  const db = getDb();

  const [service] = await db
    .select({ featuredImageId: services.featuredImageId })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!service?.featuredImageId) return { ok: true as const };

  await db
    .update(services)
    .set({ featuredImageId: null, updatedAt: new Date() })
    .where(eq(services.id, serviceId));

  await db
    .delete(serviceImages)
    .where(and(eq(serviceImages.serviceId, serviceId), eq(serviceImages.mediaAssetId, service.featuredImageId)));

  await recordActivity(user.id, "update", "service", serviceId, `Removed service featured image`);

  revalidateServiceManagement();
  revalidatePath(`/dashboard/services/${serviceId}/edit`);

  return { ok: true as const };
}

export async function removeServiceGalleryImage(serviceId: string, mediaAssetId: string) {
  await requirePermission("services:manage");
  const db = getDb();

  // Delete the actual file from storage (non-blocking on failure)
  try {
    const [asset] = await db
      .select({ storageKey: mediaAssets.storageKey })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, mediaAssetId))
      .limit(1);
    if (asset?.storageKey) {
      await deleteFile(asset.storageKey);
    }
  } catch {
    // File may not exist on disk/storage, continue
  }

  // Remove ONLY the gallery join record — keep the media asset for other references
  await db
    .delete(serviceImages)
    .where(and(eq(serviceImages.serviceId, serviceId), eq(serviceImages.mediaAssetId, mediaAssetId)));

  // If the deleted image was the featured image, promote the next gallery image (or clear)
  const [currentService] = await db
    .select({ featuredImageId: services.featuredImageId })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (currentService?.featuredImageId === mediaAssetId) {
    const [nextImage] = await db
      .select({ mediaAssetId: serviceImages.mediaAssetId })
      .from(serviceImages)
      .where(eq(serviceImages.serviceId, serviceId))
      .orderBy(asc(serviceImages.sortOrder))
      .limit(1);

    await db
      .update(services)
      .set({ featuredImageId: nextImage?.mediaAssetId ?? null, updatedAt: new Date() })
      .where(eq(services.id, serviceId));
  }

  revalidateServiceManagement();
  revalidatePath(`/dashboard/services/${serviceId}/edit`);
}
