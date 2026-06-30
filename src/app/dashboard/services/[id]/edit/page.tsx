import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { mediaAssets, services, serviceCategories, serviceFaqs, serviceImages } from "@/db/schema";
import { createServiceFaq, deleteServiceFaq, toggleServiceFaqActive, updateService, updateServiceFaq } from "@/services/actions";
import { ServiceForm } from "../../service-form";
import { GalleryManager } from "./gallery-manager";

export const dynamic = "force-dynamic";

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

  const allMedia = await db
    .select({
      id: mediaAssets.id,
      publicUrl: mediaAssets.publicUrl,
      altText: mediaAssets.altText,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      width: mediaAssets.width,
      height: mediaAssets.height,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt));

  const galleryEntries = await db
    .select({
      mediaAssetId: serviceImages.mediaAssetId,
      sortOrder: serviceImages.sortOrder,
    })
    .from(serviceImages)
    .where(eq(serviceImages.serviceId, id))
    .orderBy(asc(serviceImages.sortOrder));

  const galleryImages = galleryEntries
    .map((g) => allMedia.find((m) => m.id === g.mediaAssetId))
    .filter(Boolean);

  return (
    <ServiceForm
      categories={categories}
      action={async (data) => updateService(id, data)}
      mediaAssets={allMedia}
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
    >
      <GalleryManager serviceId={id} galleryImages={galleryImages} allMedia={allMedia} />

      <section className="mt-8 rounded-xl border border-border bg-background p-6">
        <h2 className="text-lg font-semibold">Service FAQs</h2>
        <p className="mt-2 text-sm text-muted-foreground">These appear on this service detail page.</p>

        <form action={async (formData) => { "use server"; await createServiceFaq(id, formData); }} className="mt-5 grid gap-4 rounded-2xl bg-surface-muted p-4 md:grid-cols-[1fr_1fr_6rem_auto]">
          <label className="text-sm font-medium">
            Question
            <input name="question" required className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
          </label>
          <label className="text-sm font-medium">
            Answer
            <input name="answer" required className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
          </label>
          <label className="text-sm font-medium">
            Sort
            <input name="sortOrder" type="number" defaultValue={faqs.length} className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
          </label>
          <button type="submit" className="mt-7 h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Add FAQ</button>
        </form>

        <div className="mt-5 space-y-4">
          {faqs.length === 0 ? <p className="rounded-2xl bg-surface-muted p-4 text-sm text-muted-foreground">No service FAQs yet.</p> : null}
          {faqs.map((faq) => (
            <article key={faq.id} className="rounded-2xl border border-border p-4">
              <form action={async (formData) => { "use server"; await updateServiceFaq(faq.id, formData); }} className="grid gap-4 md:grid-cols-[1fr_1fr_6rem_auto]">
                <label className="text-sm font-medium">
                  Question
                  <input name="question" required defaultValue={faq.question} className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
                </label>
                <label className="text-sm font-medium">
                  Answer
                  <input name="answer" required defaultValue={faq.answer} className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
                </label>
                <label className="text-sm font-medium">
                  Sort
                  <input name="sortOrder" type="number" defaultValue={faq.sortOrder} className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" />
                </label>
                <button type="submit" className="mt-7 h-11 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-surface-muted">Save</button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={async () => { "use server"; await toggleServiceFaqActive(faq.id); }}>
                  <button type="submit" className="h-9 rounded-xl border border-border px-3 text-xs font-semibold hover:bg-surface-muted">{faq.active ? "Deactivate" : "Activate"}</button>
                </form>
                <form action={async () => { "use server"; await deleteServiceFaq(faq.id); }}>
                  <button type="submit" className="h-9 rounded-xl border border-destructive/30 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10">Delete</button>
                </form>
                <span className={`inline-flex h-9 items-center rounded-xl px-3 text-xs font-semibold ${faq.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{faq.active ? "Active" : "Inactive"}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </ServiceForm>
  );
}
