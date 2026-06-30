import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { serviceCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createService } from "@/services/actions";
import { ServiceForm } from "../service-form";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  await requirePermission("services:manage");
  const db = getDb();

  const categories = await db
    .select({ id: serviceCategories.id, name: serviceCategories.name })
    .from(serviceCategories)
    .where(eq(serviceCategories.active, true))
    .orderBy(serviceCategories.sortOrder);

  return <ServiceForm categories={categories} action={createService} />;
}
