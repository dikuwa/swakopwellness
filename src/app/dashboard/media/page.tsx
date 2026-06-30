import { requireAuth } from "@/auth/session";
import { DashboardNav } from "@/dashboard/components";
import { getMediaAssets } from "@/media/actions";
import { UploadForm } from "./upload-form";
import { MediaGrid } from "./media-grid";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireAuth();
  const assets = await getMediaAssets();

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_20px_80px_oklch(0.235_0.025_158_/_0.08)] sm:p-8">
        <DashboardNav />
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Media</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Media Library</h1>
        <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">
          Upload and manage images for services and pages.
        </p>
        <UploadForm />
        <MediaGrid assets={assets} />
      </section>
    </main>
  );
}
