import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { policies } from "@/db/schema";
import { updatePolicy } from "@/policies/actions";
import { PolicyForm } from "../../policy-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Policy — Dashboard",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPolicyPage({ params }: PageProps) {
  await requirePermission("settings:manage");
  const db = getDb();

  const { id } = await params;

  const [policy] = await db
    .select()
    .from(policies)
    .where(eq(policies.id, id))
    .limit(1);

  if (!policy) {
    return (
      <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
        <section className="mx-auto max-w-4xl rounded-[1.5rem] border border-border bg-surface p-6 sm:p-8">
          <p className="text-muted-foreground">Policy not found.</p>
        </section>
      </main>
    );
  }

  return (
    <PolicyForm
      action={async (data) => updatePolicy(id, data)}
      initialData={{
        title: policy.title,
        slug: policy.slug,
        body: policy.body,
        publicVisible: policy.publicVisible,
      }}
    />
  );
}
