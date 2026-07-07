import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { mediaAssets, services, serviceCategories, serviceFaqs, serviceImages } from "@/db/schema";
import { createServiceFaq, deleteServiceFaq, toggleServiceFaqActive, updateService, updateServiceFaq } from "@/services/actions";
import { DashboardShell } from "@/dashboard/shell";
import { EditServiceClient } from "./edit-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Service — Dashboard",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: PageProps) {
  await requirePermission("services:manage");
  const db = getDb();

  const { id } = await params;

  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (!service) {
    notFound();
  }

  const categories = await db
    .select({ id: serviceCategories.id, name: serviceCategories.name })
    .from(serviceCategories)
    .where(eq(serviceCategories.active, true))
    .orderBy(serviceCategories.sortOrder);

  const faqs = await db
    .select()
    .from(serviceFaqs)
    .where(eq(serviceFaqs.serviceId, id))
    .orderBy(serviceFaqs.sortOrder);

  // Fetch ALL gallery images sorted by sort order
  const galleryEntries = await db
    .select({
      mediaAssetId: serviceImages.mediaAssetId,
      sortOrder: serviceImages.sortOrder,
    })
    .from(serviceImages)
    .where(eq(serviceImages.serviceId, id))
    .orderBy(asc(serviceImages.sortOrder));

  let galleryImages: { id: string; publicUrl: string | null; altText: string | null }[] = [];

  if (galleryEntries.length > 0) {
    const assetIds = galleryEntries.map((g) => g.mediaAssetId);
    const assets = await db
      .select({ id: mediaAssets.id, publicUrl: mediaAssets.publicUrl, altText: mediaAssets.altText })
      .from(mediaAssets)
      .where(inArray(mediaAssets.id, assetIds));
    // Re-sort by gallery entry sort order to maintain position
    const assetMap = new Map(assets.map((a) => [a.id, a]));
    galleryImages = galleryEntries
      .map((g) => assetMap.get(g.mediaAssetId))
      .filter(Boolean) as { id: string; publicUrl: string | null; altText: string | null }[];
  }

  // Fetch all media assets for the GalleryManager library picker
  const allMedia = await db
    .select({
      id: mediaAssets.id,
      publicUrl: mediaAssets.publicUrl,
      altText: mediaAssets.altText,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt));

  return (
    <DashboardShell>
      <EditServiceClient
        categories={categories}
        action={updateService.bind(null, id)}
        serviceId={id}
        initialData={{
          name: service.name,
          slug: service.slug,
          categoryId: service.categoryId,
          shortDescription: service.shortDescription,
          fullDescription: service.fullDescription,
          priceCents: service.priceCents,
          durationMinutes: service.durationMinutes,
          benefits: service.benefits ?? [],
          whatToExpect: service.whatToExpect,
          preparation: service.preparation,
          safetyInformation: service.safetyInformation,
          publicVisible: service.publicVisible,
          bookingEnabled: service.bookingEnabled,
          featured: service.featured,
          sortOrder: service.sortOrder,
          featuredImageId: service.featuredImageId,
        }}
        galleryImages={galleryImages}
        allMedia={allMedia}
        faqsSlot={
          <section className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Service FAQs</h2>
            <p className="mt-2 text-sm text-muted-foreground">These appear on this service detail page.</p>

            {/* Add FAQ form */}
            <form action={createServiceFaq.bind(null, id) as unknown as (fd: FormData) => Promise<void>} className="mt-5 space-y-4 rounded-2xl bg-surface-muted p-5">
              <div>
                <label htmlFor="faq-question" className="mb-1.5 block text-sm font-semibold">
                  Question *
                </label>
                <textarea
                  id="faq-question"
                  name="question"
                  required
                  rows={2}
                  className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label htmlFor="faq-answer" className="mb-1.5 block text-sm font-semibold">
                  Answer *
                </label>
                <textarea
                  id="faq-answer"
                  name="answer"
                  required
                  rows={3}
                  className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-24">
                  <label htmlFor="faq-sort" className="mb-1.5 block text-sm font-semibold">
                    Sort
                  </label>
                  <input
                    id="faq-sort"
                    name="sortOrder"
                    type="number"
                    defaultValue={faqs.length}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Add FAQ
                </button>
              </div>
            </form>

            {/* Existing FAQs */}
            <div className="mt-5 space-y-4">
              {faqs.length === 0 ? (
                <p className="rounded-2xl bg-surface-muted p-4 text-sm text-muted-foreground">No service FAQs yet.</p>
              ) : null}
              {faqs.map((faq) => (
                <article key={faq.id} className="rounded-2xl border border-border p-5">
                  <form action={updateServiceFaq.bind(null, faq.id) as unknown as (fd: FormData) => Promise<void>}>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">Question</label>
                        <textarea
                          name="question"
                          required
                          defaultValue={faq.question}
                          rows={2}
                          className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">Answer</label>
                        <textarea
                          name="answer"
                          required
                          defaultValue={faq.answer}
                          rows={3}
                          className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="w-24">
                          <label className="mb-1.5 block text-sm font-semibold">Sort</label>
                          <input
                            name="sortOrder"
                            type="number"
                            defaultValue={faq.sortOrder}
                            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <button
                          type="submit"
                          className="h-11 rounded-xl border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface-muted"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ${faq.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${faq.active ? "bg-green-600" : "bg-red-600"}`} />
                      {faq.active ? "Active" : "Inactive"}
                    </span>
                    <form action={toggleServiceFaqActive.bind(null, faq.id)}>
                      <button
                        type="submit"
                        className="h-8 rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-muted"
                      >
                        {faq.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={deleteServiceFaq.bind(null, faq.id)}>
                      <button
                        type="submit"
                        className="h-8 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </section>
        }
      />
    </DashboardShell>
  );
}
