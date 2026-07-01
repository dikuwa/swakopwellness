import { requirePermission } from "@/auth/session";
import { getDb } from "@/db/client";
import { documentNumberSequences } from "@/db/schema";
import { DashboardLayout } from "@/dashboard/components";
import { logoutAction } from "../../actions";
import { updateDocumentSequence } from "@/settings/actions";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const documentTypeLabels: Record<string, string> = {
  invoice: "Invoice",
  receipt: "Receipt",
  quotation: "Quotation",
};

export default async function DocumentNumberingPage() {
  await requirePermission("settings:manage");
  const db = getDb();

  const sequences = await db.select().from(documentNumberSequences).orderBy(asc(documentNumberSequences.documentType));

  return (
    <DashboardLayout signOutForm={<form action={logoutAction}><button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-muted">Sign out</button></form>}>
      <div className="mb-6">
          <a href="/dashboard/settings" className="text-sm text-muted-foreground hover:text-foreground">&larr; All Settings</a>
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Document Numbering</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure the numbering format for automatically generated documents. The final number is displayed as: <span className="font-mono text-foreground">PREFIX-00001</span>
        </p>
        <div className="mt-8 space-y-4">
          {sequences.length === 0 ? <p className="text-muted-foreground">No document sequences found. Please seed the database.</p> : null}
          {sequences.map((seq) => {
            const label = documentTypeLabels[seq.documentType] ?? seq.documentType.replaceAll("_", " ");
            return (
              <form key={seq.id} action={updateDocumentSequence as unknown as (formData: FormData) => Promise<void>} className="rounded-xl border border-border bg-surface-muted p-5">
                <input type="hidden" name="documentType" value={seq.documentType} />
                <h2 className="text-lg font-semibold capitalize">{label}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Preview: <span className="font-mono text-foreground">{seq.prefix}{String(seq.nextNumber).padStart(seq.padding, "0")}</span>
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor={`prefix-${seq.documentType}`} className="mb-1.5 block text-sm font-medium">Prefix</label>
                    <input id={`prefix-${seq.documentType}`} name="prefix" defaultValue={seq.prefix} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                  </div>
                  <div>
                    <label htmlFor={`nextNumber-${seq.documentType}`} className="mb-1.5 block text-sm font-medium">Next Number</label>
                    <input id={`nextNumber-${seq.documentType}`} name="nextNumber" type="number" min="1" defaultValue={seq.nextNumber} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                  </div>
                  <div>
                    <label htmlFor={`padding-${seq.documentType}`} className="mb-1.5 block text-sm font-medium">Padding</label>
                    <input id={`padding-${seq.documentType}`} name="padding" type="number" min="1" defaultValue={seq.padding} required className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-foreground" />
                  </div>
                </div>
                <div className="mt-4">
                  <button type="submit" className="h-11 rounded-xl bg-[oklch(0.49_0.16_158)] px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                    Save
                  </button>
                </div>
              </form>
            );
          })}
        </div>
    </DashboardLayout>
  );
}
