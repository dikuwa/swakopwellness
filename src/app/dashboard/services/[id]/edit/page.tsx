import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { services, serviceCategories } from "@/db/schema";
import { updateService } from "@/services/actions";
import { ServiceForm } from "../../service-form";

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

  return (
    <ServiceForm
      categories={categories}
      action={async (data) => updateService(id, data)}
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
      }}
    />
  );
}
