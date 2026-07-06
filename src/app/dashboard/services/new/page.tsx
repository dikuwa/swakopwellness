import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { serviceCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NewServiceForm } from "./new-service-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Service — Dashboard",
};

export default async function NewServicePage() {
  await requirePermission("services:manage");
  const db = getDb();

  const categories = await db
    .select({ id: serviceCategories.id, name: serviceCategories.name })
    .from(serviceCategories)
    .where(eq(serviceCategories.active, true))
    .orderBy(serviceCategories.sortOrder);

  return <NewServiceForm categories={categories} />;
}
