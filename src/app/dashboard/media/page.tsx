import { requireAuth } from "@/auth/session";
import { DashboardLayout } from "@/dashboard/components";
import { logoutAction } from "../actions";
import { getMediaAssets } from "@/media/actions";
import { UploadForm } from "./upload-form";
import { MediaGrid } from "./media-grid";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireAuth();
  const assets = await getMediaAssets();

  return (
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Media</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Media Library</h1>
      </div>
        <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">
          Upload and manage images for services and pages.
        </p>
        <UploadForm />
        <MediaGrid assets={assets} />
    </DashboardLayout>
  );
}
