import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { serviceCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createService } from "@/services/actions";
import { ServiceForm } from "../service-form";

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

  return (
    <ServiceForm categories={categories} action={createService}>
      {/* Gallery placeholder */}
      <section className="mt-8 rounded-xl border border-border bg-background p-6">
        <h2 className="text-lg font-semibold">Gallery Images</h2>
        <p className="mt-2 text-sm text-muted-foreground">Additional images displayed on the service detail page.</p>
        <div className="mt-5 flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted/50 p-8">
          <span className="text-sm text-muted-foreground">Create the service first to upload gallery images.</span>
        </div>
      </section>

      {/* FAQ placeholder */}
      <section className="mt-8 rounded-xl border border-border bg-background p-6">
        <h2 className="text-lg font-semibold">Service FAQs</h2>
        <p className="mt-2 text-sm text-muted-foreground">These appear on this service detail page.</p>
        <div className="mt-5 flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted/50 p-8">
          <span className="text-sm text-muted-foreground">Create the service first to add FAQs.</span>
        </div>
      </section>
    </ServiceForm>
  );
}
