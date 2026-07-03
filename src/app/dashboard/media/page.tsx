import { requireAuth } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { logoutAction } from "../actions";
import { getMediaWithUsage, getServicesList } from "@/media/actions";
import { UploadForm } from "./upload-form";
import { MediaGrid } from "./media-grid";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireAuth();
  const [assets, services] = await Promise.all([
    getMediaWithUsage(),
    getServicesList(),
  ]);

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Media</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Media Library</h1>
      </div>
      <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted-foreground">
        Upload and manage images for services and pages. Click any image to view details, edit alt text, assign to a service, or delete it.
      </p>
      <UploadForm />
      <MediaGrid assets={assets} services={services} />
    </DashboardShell>
  );
}
