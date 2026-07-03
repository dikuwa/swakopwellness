import Link from "next/link";
import { requirePermission } from "@/auth/session";
import { DashboardShell } from "@/dashboard/shell";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

const cards = [
  { href: "/dashboard/settings/business", title: "Business Settings", description: "Business name, address, contact details, currency, and disclaimer." },
  { href: "/dashboard/settings/communication", title: "Communication Settings", description: "Phone, email, WhatsApp and notification preferences." },
  { href: "/dashboard/settings/booking-rules", title: "Booking Rules", description: "Opening hours, timezone, request mode, and duplicate detection." },
  { href: "/dashboard/settings/document-numbering", title: "Document Numbering", description: "Prefixes, starting numbers, and padding for invoices, receipts, and quotations." },
];

export default async function SettingsIndexPage() {
  await requirePermission("settings:manage");

  return (
    <DashboardShell>
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Management</p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">Settings</h1>
      </div>
        <p className="mt-2 text-sm text-muted-foreground">Manage business configuration, communication channels, booking rules, and document numbering.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-xl border border-border bg-surface-muted p-5 transition-colors hover:bg-surface"
            >
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{card.description}</p>
            </Link>
          ))}
        </div>
    </DashboardShell>
  );
}
