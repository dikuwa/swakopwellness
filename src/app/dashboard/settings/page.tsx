import type { Metadata } from "next";
import { requireAuth } from "@/auth/session";
import { hasPermission } from "@/auth/permissions";
import { getDb } from "@/db/client";
import { businessSettings, communicationSettings, bookingRules, documentNumberSequences } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getMediaAssets } from "@/media/actions";
import { getDocumentPredefinedItems } from "@/documents/predefined-items";
import { DashboardShell } from "@/dashboard/shell";
import { SettingsTabs } from "./settings-tabs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings — Swakop Wellness Centre",
};

export default async function SettingsPage() {
  const user = await requireAuth();
  const db = getDb();
  const canManage = hasPermission(user.permissions, "settings:manage");

  if (!canManage) {
    return (
      <DashboardShell>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Settings</h1>
        <p className="mt-6 text-muted-foreground">You do not have permission to manage settings.</p>
      </DashboardShell>
    );
  }

  const [bs] = await db.select().from(businessSettings).limit(1);
  const [cs] = await db.select().from(communicationSettings).limit(1);
  const [br] = await db.select().from(bookingRules).limit(1);
  const seqs = await db.select().from(documentNumberSequences).orderBy(asc(documentNumberSequences.documentType));
  const mediaAssets = await getMediaAssets();
  const predefinedItems = await getDocumentPredefinedItems();

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Settings</h1>
      </div>
      <SettingsTabs
        businessSettings={bs}
        communicationSettings={cs}
        bookingRules={br}
        documentSequences={seqs}
        predefinedItems={predefinedItems}
        mediaAssets={mediaAssets}
      />
    </DashboardShell>
  );
}
